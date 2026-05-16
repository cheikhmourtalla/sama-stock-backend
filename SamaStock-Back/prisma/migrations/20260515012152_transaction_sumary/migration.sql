-- CreateTable
CREATE TABLE `TransactionSummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `balance` INTEGER NOT NULL,
    `entries` INTEGER NOT NULL,
    `exits` INTEGER NOT NULL,
    `transactions` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TransactionSummary` ADD CONSTRAINT `TransactionSummary_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
