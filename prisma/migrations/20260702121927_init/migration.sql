-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('FRONTEND_DEVELOPMENT', 'BACKEND_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "github" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "twitter" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "resumeUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "proficiency" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT 'FiCode',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "briefDescription" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTechnology" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullWidth" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectTechnology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLinks" (
    "id" TEXT NOT NULL,
    "live" TEXT NOT NULL DEFAULT '#',
    "clientRepo" TEXT NOT NULL DEFAULT '',
    "serverRepo" TEXT NOT NULL DEFAULT '',
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectChallenge" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFuturePlan" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectFuturePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readById" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Skill_category_order_idx" ON "Skill"("category", "order");

-- CreateIndex
CREATE INDEX "Experience_order_idx" ON "Experience"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_published_order_idx" ON "Project"("published", "order");

-- CreateIndex
CREATE INDEX "ProjectTechnology_projectId_idx" ON "ProjectTechnology"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLinks_projectId_key" ON "ProjectLinks"("projectId");

-- CreateIndex
CREATE INDEX "ProjectChallenge_projectId_order_idx" ON "ProjectChallenge"("projectId", "order");

-- CreateIndex
CREATE INDEX "ProjectFuturePlan_projectId_order_idx" ON "ProjectFuturePlan"("projectId", "order");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_read_idx" ON "Message"("read");

-- AddForeignKey
ALTER TABLE "ProjectTechnology" ADD CONSTRAINT "ProjectTechnology_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLinks" ADD CONSTRAINT "ProjectLinks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChallenge" ADD CONSTRAINT "ProjectChallenge_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFuturePlan" ADD CONSTRAINT "ProjectFuturePlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_readById_fkey" FOREIGN KEY ("readById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
