-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Indexing" (
    "id" BIGINT NOT NULL PRIMARY KEY DEFAULT 0,
    "nextTxId" BIGINT NOT NULL DEFAULT 0
);
INSERT INTO "new_Indexing" ("id", "nextTxId") SELECT "id", coalesce("nextTxId", 0) AS "nextTxId" FROM "Indexing";
DROP TABLE "Indexing";
ALTER TABLE "new_Indexing" RENAME TO "Indexing";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
