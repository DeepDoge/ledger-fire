import Database from "npm:better-sqlite3"
import type { InferModel } from "npm:drizzle-orm"
import { drizzle } from "npm:drizzle-orm/better-sqlite3"
import { blob, integer, sqliteTable, text } from "npm:drizzle-orm/sqlite-core"

const sqlite = new Database("generated/sqlite.db")
const db = drizzle(sqlite)

const transactions = sqliteTable("users", {
	id: blob("id", { mode: "bigint" }).primaryKey(),
	method: text("method").notNull(),
	data: blob("data", { mode: "buffer" }).notNull(),
	from: blob("from", { mode: "buffer" }).notNull(),
	timestamp: integer("timestamp").notNull(),
})

export type Transaction = InferModel<typeof transactions>
export namespace Transaction {
	export function create(method: string, data: Uint8Array, signature: Uint8Array) {
		return db
			.insert(transactions)
			.values({
				id: BigInt(Date.now()),
				method,
				data,
				from: new Uint8Array(),
				timestamp: Date.now(),
			})
			.returning()
	}
}
