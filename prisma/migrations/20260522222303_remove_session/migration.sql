/*
  Warnings:

  - You are about to drop the column `sessionId` on the `cash_movements` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "cash_movements" DROP CONSTRAINT "cash_movements_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "cash_sessions" DROP CONSTRAINT "cash_sessions_userId_fkey";

-- AlterTable
ALTER TABLE "cash_movements" DROP COLUMN "sessionId";
