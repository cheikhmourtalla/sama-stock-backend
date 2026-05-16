-- DropForeignKey
ALTER TABLE `transactionsummary` DROP FOREIGN KEY `TransactionSummary_transaction_id_fkey`;

-- DropIndex
DROP INDEX `TransactionSummary_transaction_id_fkey` ON `transactionsummary`;

-- AlterTable
ALTER TABLE `transactionsummary` MODIFY `transaction_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `TransactionSummary` ADD CONSTRAINT `TransactionSummary_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
