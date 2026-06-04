const http = require('http')
const fs = require('fs')
const FILE = 'C:/Users/Jay/Downloads/WhatsApp Video 2026-06-05 at 12.40.11 AM.mp4'
const html =
  '<!doctype html><html><head><meta charset=utf-8></head>' +
  '<body style="margin:0;background:#111;overflow:hidden">' +
  '<video id=v src="/vid" controls muted playsinline ' +
  'style="width:100vw;height:100vh;object-fit:contain;background:#111"></video>' +
  '</body></html>'

http
  .createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/html' })
      return res.end(html)
    }
    if (req.url === '/vid') {
      const stat = fs.statSync(FILE)
      const total = stat.size
      const range = req.headers.range
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1
        res.writeHead(206, {
          'content-range': `bytes ${start}-${end}/${total}`,
          'accept-ranges': 'bytes',
          'content-length': end - start + 1,
          'content-type': 'video/mp4',
        })
        return fs.createReadStream(FILE, { start, end }).pipe(res)
      }
      res.writeHead(200, { 'content-length': total, 'content-type': 'video/mp4', 'accept-ranges': 'bytes' })
      return fs.createReadStream(FILE).pipe(res)
    }
    res.writeHead(404)
    res.end()
  })
  .listen(8899, () => console.log('vidserve on http://localhost:8899'))
