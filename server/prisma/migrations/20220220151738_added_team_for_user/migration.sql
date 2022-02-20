/*
  Warnings:

  - Added the required column `callType` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TeamCallType" AS ENUM ('SIMULTANEOUSLY', 'FIRST_ORDER', 'ROUND_ROBIN');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "callType" "TeamCallType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "teamId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
