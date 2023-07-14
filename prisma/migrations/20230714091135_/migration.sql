/*
  Warnings:

  - You are about to drop the column `txId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `txId` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `txId` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `nonce` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `txId` on the `Warehouse` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brandId" BIGINT NOT NULL,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brandId", "id", "name") SELECT "brandId", "id", "name" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE TABLE "new_Brand" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Brand" ("id", "name") SELECT "id", "name" FROM "Brand";
DROP TABLE "Brand";
ALTER TABLE "new_Brand" RENAME TO "Brand";
CREATE TABLE "new_Stock" (
    "quantity" BIGINT NOT NULL,
    "warehouseId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,

    PRIMARY KEY ("warehouseId", "productId"),
    CONSTRAINT "Stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stock" ("productId", "quantity", "warehouseId") SELECT "productId", "quantity", "warehouseId" FROM "Stock";
DROP TABLE "Stock";
ALTER TABLE "new_Stock" RENAME TO "Stock";
CREATE TABLE "new_Transaction" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "from" BLOB NOT NULL,
    "method" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Transaction" ("data", "from", "id", "method", "timestamp") SELECT "data", "from", "id", "method", "timestamp" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_from_idx" ON "Transaction"("from");
CREATE TABLE "new_Warehouse" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL
);
INSERT INTO "new_Warehouse" ("address", "id", "name") SELECT "address", "id", "name" FROM "Warehouse";
DROP TABLE "Warehouse";
ALTER TABLE "new_Warehouse" RENAME TO "Warehouse";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
