/*
  Warnings:

  - A unique constraint covering the columns `[companyId,slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_companyId_slug_key" ON "Category"("companyId", "slug");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
