-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "from" BLOB NOT NULL,
    "nonce" BIGINT NOT NULL,
    "method" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "txId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    CONSTRAINT "Warehouse_txId_fkey" FOREIGN KEY ("txId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "txId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Brand_txId_fkey" FOREIGN KEY ("txId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "txId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" BIGINT NOT NULL,
    CONSTRAINT "Product_txId_fkey" FOREIGN KEY ("txId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stock" (
    "txId" BIGINT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "warehouseId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,

    PRIMARY KEY ("warehouseId", "productId"),
    CONSTRAINT "Stock_txId_fkey" FOREIGN KEY ("txId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMove" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "txId" BIGINT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "warehouseId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,
    CONSTRAINT "StockMove_txId_fkey" FOREIGN KEY ("txId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMove_warehouseId_productId_fkey" FOREIGN KEY ("warehouseId", "productId") REFERENCES "Stock" ("warehouseId", "productId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMove_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMove_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Transaction_from_idx" ON "Transaction"("from");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_from_nonce_key" ON "Transaction"("from", "nonce");
