/*
  Warnings:

  - Added the required column `alertThreshold` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product` ADD COLUMN `alertThreshold` INTEGER NOT NULL;
