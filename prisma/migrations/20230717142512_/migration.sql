-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Indexing" (
    "id" BIGINT NOT NULL PRIMARY KEY DEFAULT 0,
    "lastIndexedTxId" BIGINT,
    CONSTRAINT "Indexing_lastIndexedTxId_fkey" FOREIGN KEY ("lastIndexedTxId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Indexing" ("id", "lastIndexedTxId") SELECT "id", "lastIndexedTxId" FROM "Indexing";
DROP TABLE "Indexing";
ALTER TABLE "new_Indexing" RENAME TO "Indexing";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
