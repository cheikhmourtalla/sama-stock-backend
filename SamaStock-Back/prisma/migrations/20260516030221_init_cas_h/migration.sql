/*
  Warnings:

  - You are about to drop the `transactionsummary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `transactionsummary` DROP FOREIGN KEY `TransactionSummary_transaction_id_fkey`;

-- DropTable
DROP TABLE `transactionsummary`;
