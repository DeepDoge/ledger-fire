-- CreateTable
CREATE TABLE "Indexing" (
    "id" BIGINT NOT NULL PRIMARY KEY DEFAULT 0,
    "lastIndexedTxId" BIGINT NOT NULL,
    CONSTRAINT "Indexing_lastIndexedTxId_fkey" FOREIGN KEY ("lastIndexedTxId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
