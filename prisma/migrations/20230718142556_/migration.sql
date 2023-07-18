-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "from" BLOB NOT NULL,
    "method" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "timestamp" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "Indexing" (
    "id" BIGINT NOT NULL PRIMARY KEY DEFAULT 0,
    "nextTxId" BIGINT,
    CONSTRAINT "Indexing_nextTxId_fkey" FOREIGN KEY ("nextTxId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brandId" BIGINT NOT NULL,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stock" (
    "quantity" BIGINT NOT NULL,
    "warehouseId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,

    PRIMARY KEY ("warehouseId", "productId"),
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
