-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_supplier_id_fkey`;

-- DropIndex
DROP INDEX `Product_supplier_id_fkey` ON `product`;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
