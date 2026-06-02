/* eslint-disable */
const fs = require('fs')
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak,
} = require('docx')

// ---- palette ---------------------------------------------------------------
const INK = '202124'
const INK2 = '3C4043'
const INK3 = '5F6368'
const LINE = 'D9D9D6'
const BLUE = '1A73E8'
const BLUED = '174EA6'
const RED = 'EA4335'
const YELLOW = 'F9AB00'
const GREEN = '188038'
const GREY = '5F6368'
const CFORANGE = 'F38020'
const SOFT = 'F4F4F0'
const BLUESOFT = 'E8F0FE'

const CONTENT_W = 9360 // US Letter, 1in margins

// ---- tiny helpers ----------------------------------------------------------
const t = (text, opts = {}) => new TextRun({ text, font: 'Arial', ...opts })
const p = (children, opts = {}) =>
  new Paragraph({ children: Array.isArray(children) ? children : [children], ...opts })

function para(text, opts = {}) {
  const { spacingAfter = 120, ...rest } = opts
  return new Paragraph({
    spacing: { after: spacingAfter, line: 276 },
    children: [t(text, rest.run || {})],
    ...(rest.paragraph || {}),
  })
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(text)] })
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(text)] })
}

function bullet(text, runs) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 80, line: 276 },
    children: runs || [t(text)],
  })
}
function numbered(ref, children) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 90, line: 276 },
    children: Array.isArray(children) ? children : [t(children)],
  })
}

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: LINE }
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
const noBorders = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
}

// A single coloured "box" for diagrams (full width or given width).
function flowBox(fill, title, subtitle, width = CONTENT_W, textColor = 'FFFFFF') {
  const kids = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: subtitle ? 40 : 0 },
      children: [t(title, { bold: true, color: textColor, size: 24 })],
    }),
  ]
  if (subtitle) {
    kids.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [t(subtitle, { color: textColor, size: 18 })],
    }))
  }
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: [width],
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: width, type: WidthType.DXA },
        borders: cellBorders,
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: kids,
      })],
    })],
  })
}

// A downward arrow with a small label, centred.
function arrow(label) {
  const kids = [t('↓', { size: 32, color: INK3, bold: true })]
  if (label) kids.push(t('  ' + label, { size: 16, color: INK3, italics: true }))
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: kids,
  })
}

// A row of N equal coloured boxes (for side-by-side diagrams).
function boxRow(boxes) {
  const gap = 160
  const w = Math.floor((CONTENT_W - gap * (boxes.length - 1)) / boxes.length)
  const cells = []
  boxes.forEach((b, i) => {
    cells.push(new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: cellBorders,
      shading: { fill: b.fill, type: ShadingType.CLEAR },
      margins: { top: 130, bottom: 130, left: 110, right: 110 },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
          children: [t(b.title, { bold: true, color: b.textColor || 'FFFFFF', size: 22 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
          children: [t(b.subtitle, { color: b.textColor || 'FFFFFF', size: 16 })] }),
      ],
    }))
    if (i < boxes.length - 1) {
      cells.push(new TableCell({
        width: { size: gap, type: WidthType.DXA }, borders: noBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [t('→', { size: 26, color: INK3, bold: true })] })],
      }))
    }
  })
  const widths = []
  boxes.forEach((b, i) => { widths.push(w); if (i < boxes.length - 1) widths.push(gap) })
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    borders: noBorders,
    rows: [new TableRow({ children: cells })],
  })
}

// A clean data table: header row + body rows. cols = [{w, head}], rows = [[c1,c2,...]]
function dataTable(cols, rows, headFill = BLUESOFT) {
  const widths = cols.map((c) => c.w)
  const headCells = cols.map((c) => new TableCell({
    width: { size: c.w, type: WidthType.DXA }, borders: cellBorders,
    shading: { fill: headFill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [t(c.head, { bold: true, color: BLUED, size: 20 })] })],
  }))
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((cell, ci) => new TableCell({
      width: { size: cols[ci].w, type: WidthType.DXA }, borders: cellBorders,
      shading: { fill: ri % 2 ? 'FFFFFF' : SOFT, type: ShadingType.CLEAR },
      margins: { top: 70, bottom: 70, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: (Array.isArray(cell) ? cell : [cell]).map((line, li) =>
        new Paragraph({ spacing: { after: 0, line: 264 },
          children: [t(line, { size: 19, color: ci === 0 ? INK : INK2, bold: ci === 0 })] })),
    })),
  }))
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: headCells }), ...bodyRows],
  })
}

function spacer(after = 160) {
  return new Paragraph({ spacing: { after }, children: [t('')] })
}

// Callout / note box (full width, soft fill, left accent).
function note(title, lines) {
  const kids = [new Paragraph({ spacing: { after: 60 }, children: [t(title, { bold: true, color: BLUED, size: 20 })] })]
  lines.forEach((l) => kids.push(new Paragraph({ spacing: { after: 0, line: 264 }, children: [t(l, { size: 19, color: INK2 })] })))
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: { top: thinBorder, bottom: thinBorder, right: thinBorder,
        left: { style: BorderStyle.SINGLE, size: 24, color: BLUE } },
      shading: { fill: BLUESOFT, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 140 },
      children: kids,
    })] })],
  })
}

// =============================================================================
//  DOCUMENT CONTENT
// =============================================================================
const children = []

// ---- COVER -----------------------------------------------------------------
children.push(new Paragraph({ spacing: { before: 1400, after: 0 }, children: [] }))
// coloured banner
children.push(new Table({
  width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
  rows: [new TableRow({ children: [new TableCell({
    width: { size: CONTENT_W, type: WidthType.DXA }, borders: noBorders,
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    margins: { top: 420, bottom: 420, left: 300, right: 300 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
        children: [t('NBS SAPAC Chronicle', { bold: true, color: 'FFFFFF', size: 52 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
        children: [t('How the System Works, Behind the Scenes', { color: 'FFFFFF', size: 26 })] }),
    ],
  })] })],
}))
children.push(spacer(240))
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [t('A plain-English guide for non-technical readers', { size: 24, color: INK2, italics: true })] }))
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
  children: [t('No engineering background needed. Every idea is explained with everyday comparisons.', { size: 20, color: INK3 })] }))
children.push(spacer(900))
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [t('Internal platform for the NBS SAPAC team (India and Singapore, ~60 people)', { size: 19, color: INK3 })] }))
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [t('Live at nbschronicle.com', { size: 19, color: BLUED, bold: true })] }))
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
  children: [t('Prepared June 2026', { size: 19, color: INK3 })] }))
children.push(new Paragraph({ children: [new PageBreak()] }))

// ---- TABLE OF CONTENTS -----------------------------------------------------
children.push(h1('Contents'))
children.push(new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-2' }))
children.push(new Paragraph({ children: [new PageBreak()] }))

// ---- 1. EXECUTIVE SUMMARY --------------------------------------------------
children.push(h1('1. In one minute'))
children.push(para('The NBS SAPAC Chronicle is a private social platform built just for our team. It is the team’s shared scrapbook: a place to post photos and videos from events, announce things that are coming up, RSVP to them, tag teammates, and keep a tidy quarter-by-quarter history of the moments we share.'))
children.push(para('This document explains the part most people never see: the "behind the scenes" engine. It covers where the information is kept, how it travels from a teammate’s phone to our system and back, and how we keep it fast, safe, and always available. Everything here is written in everyday language.'))
children.push(spacer(80))
children.push(note('The short version', [
  'It is one private system that the team fully owns and controls.',
  'It has three parts: the screen you see, a "brain" that does the work, and a "memory" that stores everything.',
  'It is protected so only Google teammates can get in, and it is built to stay online on its own.',
]))

// ---- 2. THE BIG PICTURE ----------------------------------------------------
children.push(h1('2. The big picture: three parts working together'))
children.push(para('It helps to picture a restaurant. You sit in the dining room, you never walk into the kitchen, and you never rummage through the pantry. You simply place an order, and what you asked for comes back to your table. Our platform works the same way, with three parts that each have one job.'))
children.push(spacer(80))
children.push(boxRow([
  { fill: BLUE, title: 'The dining room', subtitle: 'What you see and tap (the "frontend")' },
  { fill: RED, title: 'The kitchen', subtitle: 'Does the actual work (the "backend")' },
  { fill: GREEN, title: 'The pantry', subtitle: 'Keeps every ingredient (the "database")' },
]))
children.push(spacer(120))
children.push(para('Keeping these three separate is deliberate. It keeps the system organised, makes it faster, and (most importantly) keeps it secure: guests never touch the kitchen or the pantry directly. This document is mostly about the kitchen and the pantry, which together are called the backend.', { spacingAfter: 60 }))

// ---- 3. WHERE EVERYTHING LIVES ---------------------------------------------
children.push(h1('3. Where everything lives'))
children.push(para('Everything runs on one private server. A server is simply a powerful computer that is always switched on, kept in a professional data centre, and reachable over the internet. This one belongs to the team, so we are fully in control of it. The public address people type into their browser is nbschronicle.com.'))
children.push(para('Four pieces work together on that server. Here they are with a plain-English role for each:'))
children.push(spacer(40))
children.push(dataTable(
  [{ w: 2600, head: 'Piece' }, { w: 6760, head: 'What it does, in plain terms' }],
  [
    ['Cloudflare', 'A global security gate and speed booster that sits in front of everything. It blocks bad traffic and makes the site load quickly worldwide.'],
    ['Nginx', 'The front desk. It greets every visitor and points them to the right place: either the web pages or the data service.'],
    ['The Backend', 'The brain. It does the thinking, applies the rules, and decides what information to fetch or save.'],
    ['The Database', 'The filing cabinet. It reliably remembers every post, comment, name, and photo location.'],
  ],
))
children.push(spacer(140))
children.push(para('Visually, a single request travels through them in a straight line and comes back:', { spacingAfter: 100 }))

// architecture vertical flow
children.push(flowBox(GREY, 'A teammate’s web browser', 'Phone or laptop, anywhere'))
children.push(arrow('opens nbschronicle.com'))
children.push(flowBox(CFORANGE, 'Cloudflare', 'Security gate + global speed booster'))
children.push(arrow('passes safe traffic through'))
children.push(flowBox(YELLOW, 'Nginx  (the front desk)', 'Directs the request to the right place', CONTENT_W, INK))
children.push(arrow('data requests go to the brain'))
children.push(flowBox(BLUE, 'The Backend  (the brain)', 'Checks permissions and prepares the answer'))
children.push(arrow('asks for or saves information'))
children.push(flowBox(GREEN, 'The Database  (the filing cabinet)', 'Stores and returns the information'))
children.push(spacer(120))
children.push(note('Good to know', [
  'The front desk (Nginx) also hands over the website’s display files directly, so pages appear instantly.',
  'The filing cabinet (database) is sealed off from the public internet. Only our own brain (backend) is allowed to talk to it.',
]))

// ---- 4. WHAT HAPPENS WHEN SOMEONE USES IT ----------------------------------
children.push(h1('4. What happens when someone uses it'))
children.push(para('Here is a real example, step by step. Imagine Priya opens the feed on her phone to see the latest posts. Everything below happens in about one second.'))
children.push(spacer(40))
children.push(numbered('steps', 'Priya’s browser asks nbschronicle.com for the page.'))
children.push(numbered('steps', 'Cloudflare checks the request is safe and waves it through.'))
children.push(numbered('steps', 'Nginx, the front desk, hands over the website’s display files.'))
children.push(numbered('steps', 'The page then asks the backend a simple question: "what are the latest posts?"'))
children.push(numbered('steps', 'The backend asks the database for the posts, their photos, comments, and reactions.'))
children.push(numbered('steps', 'The database returns exactly that information.'))
children.push(numbered('steps', 'The backend tidies it into a neat package and sends it back.'))
children.push(numbered('steps', 'Priya sees the feed, fully loaded, almost instantly.'))
children.push(spacer(60))
children.push(para('This same back-and-forth happens for every action: liking a post, RSVPing to an event, or writing a comment. The browser asks, the backend checks the rules and talks to the database, and a clean answer comes back.', { spacingAfter: 60 }))

// ---- 5. THE BACKEND'S JOB --------------------------------------------------
children.push(h1('5. The backend’s job, explained simply'))
children.push(para('The backend is the waiter and the kitchen combined. Whenever the app needs something done, the backend is what does it. Its responsibilities are:'))
children.push(bullet('Check who you are. Are you signed in? Are you an approved member?'))
children.push(bullet('Take the request, such as "show the feed", "post this photo", or "RSVP going".'))
children.push(bullet('Fetch or save the right information in the database.'))
children.push(bullet('Apply the rules. For example, only admins can approve new members, and you can only edit or delete your own comment.'))
children.push(bullet('Send back a clean, ready-to-show answer.'))
children.push(spacer(80))
children.push(para('The backend offers its services through a set of clearly labelled "service windows". Together these windows are called the API. Think of a row of counters at a well-run government office: each counter handles exactly one type of request, so nothing gets mixed up and the queue moves quickly. A few of our counters, in plain terms:'))
children.push(spacer(40))
children.push(dataTable(
  [{ w: 3400, head: 'Service window' }, { w: 5960, head: 'What it handles' }],
  [
    ['"Who am I?"', 'Confirms your identity and whether you are approved.'],
    ['"Get the posts"', 'Returns the latest entries for the chosen quarter.'],
    ['"Add a post"', 'Saves a new post with its photos, story, and tags.'],
    ['"Upload a photo or video"', 'Stores the file safely and remembers where it is.'],
    ['"RSVP to an event"', 'Records that you are Going or Interested.'],
    ['"Add a comment"', 'Saves your reply and notifies anyone you tagged.'],
  ],
))

// ---- 6. WHAT INFORMATION WE STORE ------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }))
children.push(h1('6. What information we store'))
children.push(para('The filing cabinet (database) keeps a handful of clearly defined record types. In everyday language:'))
children.push(spacer(40))
children.push(dataTable(
  [{ w: 2300, head: 'Record' }, { w: 7060, head: 'What it holds' }],
  [
    ['People', 'Each teammate: name, profile photo, office (India or Singapore), team, and role (member or admin).'],
    ['Posts and Events', 'A shared moment or an upcoming event: its title, story, date, and which quarter it belongs to.'],
    ['Photos and Videos', 'The actual media attached to a post, plus a small preview version of each.'],
    ['Comments', 'The replies people write under a post.'],
    ['Reactions', 'Likes, and event RSVPs (Going or Interested).'],
    ['Notifications', 'Alerts, such as when someone tags you.'],
    ['Quarters', 'The time buckets (for example Q2 2026) used to organise the archive.'],
    ['Activity log', 'A private record of important actions, available to admins.'],
  ],
))
children.push(spacer(140))
children.push(para('These records connect to each other like a simple family tree. One person can write many posts. One post can hold many photos, many comments, and many reactions. Every comment and reaction belongs to exactly one person and one post.', { spacingAfter: 100 }))
// data-model mini diagram
children.push(boxRow([
  { fill: BLUE, title: 'A Person', subtitle: 'writes' },
  { fill: RED, title: 'A Post', subtitle: 'a shared moment' },
]))
children.push(arrow('one post brings together'))
children.push(boxRow([
  { fill: GREEN, title: 'Photos & Videos', subtitle: 'the media' },
  { fill: YELLOW, title: 'Comments', subtitle: 'the replies', textColor: INK },
  { fill: GREY, title: 'Reactions', subtitle: 'likes and RSVPs' },
]))

// ---- 7. FEATURES -----------------------------------------------------------
children.push(new Paragraph({ children: [new PageBreak()] }))
children.push(h1('7. The main features, and how they work'))

children.push(h2('Signing in'))
children.push(para('People sign in with their Google work account, so only @google.com teammates can get in. There are no separate passwords for us to manage. When someone brand new signs in, they wait in a "pending" state until an admin approves them. This keeps the platform private to the team.'))

children.push(h2('Posting a moment'))
children.push(para('A teammate picks photos or videos, writes a short story, tags colleagues, chooses a category, and publishes. Behind the scenes the backend shrinks large images to a sensible size automatically, so pages stay fast and storage stays lean, without the person having to think about it.'))

children.push(h2('Photos and videos'))
children.push(para('When someone uploads media, the backend saves the file safely on the server and records where it lives. It also creates a small "thumbnail" (a quick-loading preview). Posts can hold several photos and videos, shown as a swipeable gallery.'))

children.push(h2('Upcoming events and RSVP'))
children.push(para('Anyone can announce an event with a date and venue. Teammates respond with Going or Interested, and the counts update live. Public events also have a one-click "Share to LinkedIn" button for easy promotion.'))

children.push(h2('Tagging teammates (mentions)'))
children.push(para('Typing the "@" symbol lets you tag a colleague, who then gets a notification. A nice detail: this keeps working even if that person later changes their display name, because the system tags the person, not the spelling of their name.'))

children.push(h2('Notifications, search, and the archive'))
children.push(bullet('Notifications: a bell icon lights up when you have been tagged.'))
children.push(bullet('Search: find people, events, or moments by typing a name or keyword.'))
children.push(bullet('Archive: each quarter is sealed and saved, so the team can revisit any past quarter like flipping through a yearbook.'))

children.push(h2('Admin dashboard'))
children.push(para('Admins get a private control panel where they can approve new members, review the activity log, and edit or remove content if needed.', { spacingAfter: 60 }))

// ---- 8. SECURITY -----------------------------------------------------------
children.push(h1('8. Keeping it safe'))
children.push(para('Privacy and security were built in from the start. In plain terms:'))
children.push(bullet('Only Google work accounts can sign in. Outsiders simply cannot get in.'))
children.push(bullet('Every new member must be approved by an admin before they can see anything.'))
children.push(bullet('We never store anyone’s password. Google handles the actual login; we only receive a confirmation that the person is who they say they are.'))
children.push(bullet('Once signed in, a teammate carries a secure "session pass", much like a wristband at an event, kept safely in their browser.'))
children.push(bullet('All traffic is encrypted (the padlock you see in the browser). Nobody can snoop on the information as it travels.'))
children.push(bullet('The server keeps almost every door closed. Only the website and the secure data service are reachable.'))
children.push(bullet('The database is not reachable from the public internet at all. Only our own backend can talk to it.'))

// ---- 9. RELIABILITY --------------------------------------------------------
children.push(h1('9. Keeping it running'))
children.push(para('The platform is built to look after itself with very little babysitting:'))
children.push(bullet('A "supervisor" program watches the backend and restarts it automatically if it ever stops, including after the server reboots.'))
children.push(bullet('A free monitoring service checks the site every five minutes, around the clock, and emails us immediately if anything goes down.'))
children.push(bullet('Photos and videos are delivered through Cloudflare’s worldwide network, so teammates in both India and Singapore get fast loading.'))

// ---- 10. COST --------------------------------------------------------------
children.push(h1('10. What it costs to run'))
children.push(para('The platform runs on infrastructure the team already controls. The ongoing third-party cost is effectively zero: the security and speed layer (Cloudflare), the uptime monitoring, and the core software are all free tiers or open-source tools. The only real asset is the team’s own always-on server.'))

// ---- 11. TECH IN ONE TABLE -------------------------------------------------
children.push(h1('11. The technology, in one table'))
children.push(para('For reference, here is the full stack with a plain-English role for each piece. None of this is needed to understand the rest of the document.'))
children.push(spacer(40))
children.push(dataTable(
  [{ w: 2700, head: 'Layer' }, { w: 3000, head: 'Tool used' }, { w: 3660, head: 'Plain-English role' }],
  [
    ['Web pages', 'React', 'The part people see and click.'],
    ['Front desk', 'Nginx', 'Greets visitors, directs traffic, serves pages.'],
    ['Security and speed', 'Cloudflare', 'Global gate and accelerator.'],
    ['The brain', 'Node.js with Express', 'Does the thinking and applies the rules.'],
    ['The memory', 'PostgreSQL', 'Stores everything reliably.'],
    ['Stay-alive', 'PM2 and UptimeRobot', 'Auto-restart and round-the-clock monitoring.'],
  ],
))

// ---- 12. GLOSSARY ----------------------------------------------------------
children.push(h1('12. Glossary'))
children.push(dataTable(
  [{ w: 2400, head: 'Term' }, { w: 6960, head: 'Plain-English meaning' }],
  [
    ['Frontend', 'What you see and tap on the screen.'],
    ['Backend', 'The behind-the-scenes "brain" that does the work.'],
    ['Database', 'The organised storage that remembers everything.'],
    ['Server', 'The always-on computer that runs the whole platform.'],
    ['API', 'The set of labelled "service windows" the backend offers.'],
    ['Cloudflare', 'A security and speed layer that sits in front of the site.'],
    ['Nginx', 'The traffic director that greets and routes every visitor.'],
    ['Encryption', 'Scrambling information so only the right people can read it.'],
    ['Thumbnail', 'A small, quick-loading preview version of an image.'],
    ['Session pass', 'A secure token, like a wristband, that proves you are signed in.'],
  ],
))
children.push(spacer(160))
children.push(note('In summary', [
  'The NBS SAPAC Chronicle is a clean, modern, secure platform that the team fully owns.',
  'It is organised into three clear parts, protected so only teammates can enter, and built to stay online on its own.',
  'It is fast for users in both India and Singapore, and it costs almost nothing to keep running.',
]))

// =============================================================================
//  DOCUMENT SHELL
// =============================================================================
const doc = new Document({
  creator: 'NBS SAPAC Chronicle',
  title: 'NBS SAPAC Chronicle: How the System Works',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: INK2 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: 'Arial', color: BLUED },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 6 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: INK },
        paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•',
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.',
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } },
        children: [
          t('NBS SAPAC Chronicle   ·   How the System Works   ·   Page ', { size: 16, color: INK3 }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: INK3 }),
        ],
      })] }),
    },
    children,
  }],
})

Packer.toBuffer(doc).then((buf) => {
  const out = 'F:/Google NBS SAPAC/docs/NBS-SAPAC-Chronicle-Backend-Explained.docx'
  fs.writeFileSync(out, buf)
  console.log('WROTE', out, '(' + buf.length + ' bytes)')
})
