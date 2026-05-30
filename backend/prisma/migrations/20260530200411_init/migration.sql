-- CreateEnum
CREATE TYPE "Role" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'approved', 'disabled');

-- CreateEnum
CREATE TYPE "QuarterStatus" AS ENUM ('live', 'archived');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('post', 'upcoming_event');

-- CreateEnum
CREATE TYPE "Tag" AS ENUM ('Team event', 'Learning', 'Team win', 'External', 'Life outside work', 'Just a vibe');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('like', 'going', 'interested');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('user_login', 'user_signup', 'user_approved', 'user_rejected', 'user_role_changed', 'user_disabled', 'user_profile_updated', 'entry_created', 'entry_edited', 'entry_deleted', 'entry_auto_converted', 'comment_added', 'comment_deleted', 'reaction_added', 'reaction_removed', 'quarter_created', 'quarter_archived');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "avatarInitials" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL DEFAULT '#4285F4',
    "office" TEXT,
    "team" TEXT,
    "role" "Role" NOT NULL DEFAULT 'member',
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quarter" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "QuarterStatus" NOT NULL DEFAULT 'live',

    CONSTRAINT "Quarter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "quarterId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "EntryType" NOT NULL DEFAULT 'post',
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "tag" "Tag" NOT NULL DEFAULT 'Team event',
    "heroPhotoId" TEXT,
    "eventName" TEXT,
    "eventDate" TIMESTAMP(3),
    "venue" TEXT,
    "venueMapUrl" TEXT,
    "publicSlug" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "goingCount" INTEGER NOT NULL DEFAULT 0,
    "interestedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "label" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("entryId","userId","type")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EntryContributors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Quarter_status_idx" ON "Quarter"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_heroPhotoId_key" ON "Entry"("heroPhotoId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_publicSlug_key" ON "Entry"("publicSlug");

-- CreateIndex
CREATE INDEX "Entry_quarterId_type_createdAt_idx" ON "Entry"("quarterId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Entry_authorId_idx" ON "Entry"("authorId");

-- CreateIndex
CREATE INDEX "Entry_type_eventDate_idx" ON "Entry"("type", "eventDate");

-- CreateIndex
CREATE INDEX "Photo_entryId_order_idx" ON "Photo"("entryId", "order");

-- CreateIndex
CREATE INDEX "Reaction_entryId_type_idx" ON "Reaction"("entryId", "type");

-- CreateIndex
CREATE INDEX "Comment_entryId_createdAt_idx" ON "Comment"("entryId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_targetType_targetId_idx" ON "ActivityLog"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "_EntryContributors_AB_unique" ON "_EntryContributors"("A", "B");

-- CreateIndex
CREATE INDEX "_EntryContributors_B_index" ON "_EntryContributors"("B");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "Quarter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_heroPhotoId_fkey" FOREIGN KEY ("heroPhotoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryContributors" ADD CONSTRAINT "_EntryContributors_A_fkey" FOREIGN KEY ("A") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryContributors" ADD CONSTRAINT "_EntryContributors_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
