-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SENT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('LINKEDIN', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "Relation" AS ENUM ('COLLEAGUE', 'MANAGER', 'REPORT', 'FRIEND', 'OTHER');

-- CreateEnum
CREATE TYPE "Closeness" AS ENUM ('VERY_WELL', 'WELL', 'SUPERFICIAL');

-- CreateEnum
CREATE TYPE "CoinsStatus" AS ENUM ('PENDING', 'AWARDED', 'FAILED', 'NOT_ELIGIBLE');

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "scheduledSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "slackUserId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageTs" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "authorSlackId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "contactRaw" TEXT NOT NULL,
    "contactKey" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "companyRole" TEXT,
    "relation" "Relation",
    "closeness" "Closeness",
    "mayMentionAuthor" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "coinsAmount" INTEGER NOT NULL DEFAULT 0,
    "coinsStatus" "CoinsStatus" NOT NULL,
    "notionPageId" TEXT,
    "channelId" TEXT NOT NULL,
    "threadTs" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Round_weekKey_key" ON "Round"("weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_roundId_slackUserId_key" ON "Delivery"("roundId", "slackUserId");

-- CreateIndex
CREATE INDEX "Recommendation_contactKey_idx" ON "Recommendation"("contactKey");

-- CreateIndex
CREATE INDEX "Recommendation_roundId_authorSlackId_idx" ON "Recommendation"("roundId", "authorSlackId");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

