-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('active', 'paused', 'archived');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL,
    "ctaUrl" TEXT NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'active',
    "budget" DECIMAL(10,2),
    "spendCap" DECIMAL(10,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Impression" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "userId" TEXT,
    "question" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "idempotencyKey" TEXT,

    CONSTRAINT "Impression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdMetrics" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spend" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "AdMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Ad_status_idx" ON "Ad"("status");

-- CreateIndex
CREATE INDEX "Ad_categoryId_idx" ON "Ad"("categoryId");

-- CreateIndex
CREATE INDEX "Ad_companyId_idx" ON "Ad"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Impression_idempotencyKey_key" ON "Impression"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Impression_adId_idx" ON "Impression"("adId");

-- CreateIndex
CREATE INDEX "Impression_userId_idx" ON "Impression"("userId");

-- CreateIndex
CREATE INDEX "Impression_timestamp_idx" ON "Impression"("timestamp");

-- CreateIndex
CREATE INDEX "Impression_sessionId_idx" ON "Impression"("sessionId");

-- CreateIndex
CREATE INDEX "Impression_clicked_idx" ON "Impression"("clicked");

-- CreateIndex
CREATE INDEX "AdMetrics_date_idx" ON "AdMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AdMetrics_adId_date_key" ON "AdMetrics"("adId", "date");

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impression" ADD CONSTRAINT "Impression_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impression" ADD CONSTRAINT "Impression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdMetrics" ADD CONSTRAINT "AdMetrics_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
