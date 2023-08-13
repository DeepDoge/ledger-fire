import { Bytes } from "@/utils/bytes"
import { PrismaClient } from "@prisma/client"
import fs from "fs/promises"
import path from "path"
import { z } from "zod"
import type { Database } from "./database"

export const txRequestParser = z.object({
	mutatorName: z.string(),
	params: z.unknown(),
	from: z.instanceof(Uint8Array),
	language: z.string(),
})
export type TxRequest = z.infer<typeof txRequestParser>

export const txParser = z.intersection(
	txRequestParser,
	z.object({
		id: z.bigint(),
		timestamp: z.number(),
	})
)
export type Tx = z.infer<typeof txParser>

export type MutatorParserOptions = Pick<Tx, "language">

function createDatabase<TStore extends Database.TxStore<TxRequest, Tx>, TIndexer extends Database.TxIndexer<TxRequest, Tx>>({
	txStore,
	txIndexer,
}: {
	txStore: TStore
	txIndexer: TIndexer
}): Database {
	return {
		async startIndexer() {
			await txIndexer.start({ txStore })
		},
		async handleTxRequest({ body }) {
			if (!(body instanceof Uint8Array)) throw new Error("Request body must be a Uint8Array")
			const txRequest = txRequestParser.parse(Bytes.decode(body))

			const tx = await txStore.add({ txRequest })

			return Bytes.encode(tx)
		},
		async handleQueryRequest({ headers, body }) {
			throw new Error("Not implemented")
		},
	}
}

async function createTxFileBasedStore({ dirname }: { dirname: string }): Promise<Database.TxStore<TxRequest, Tx>> {
	dirname = path.resolve(dirname)
	const idFilename = path.join(dirname, "id")

	let nextId = await fs
		.readFile(idFilename)
		.then((data) => BigInt(data.toString("utf-8")))
		.catch(() => BigInt(0))

	return {
		async add({ txRequest }) {
			const tx: Tx = {
				...txRequest,
				id: nextId,
				timestamp: Date.now(),
			}

			const txIdHex = tx.id.toString(16).padStart(16, "0")
			const txFilename = path.join(dirname, ...txIdHex, "tx")
			await fs.mkdir(path.dirname(txFilename), { recursive: true })
			await fs.writeFile(txFilename, Bytes.encode(tx))

			nextId++
			await fs.writeFile(idFilename, nextId.toString())

			return tx
		},
		async get({ id }) {
			const txIdHex = id.toString(16).padStart(16, "0")
			const txFilename = path.join(dirname, ...txIdHex, "tx")
			const tx = await fs
				.readFile(txFilename)
				.then((data) => txParser.parse(Bytes.decode(data)))
				.catch(() => null)

			return tx
		},
	}
}

function createTxPrismaIndexer<TMutatorFactories extends Record<string, Database.Mutator.Factory<Tx, MutatorParserOptions>>>({
	mutatorFactories,
	prisma,
}: {
	mutatorFactories: TMutatorFactories
	prisma: PrismaClient
}): Database.TxIndexer<TxRequest, Tx> {
	return {
		async start({ txStore }) {
			while (true) {
				await prisma.$transaction(async (prisma) => {
					const txId = await prisma.transaction
						.findFirstOrThrow({ select: { id: true }, orderBy: { id: "desc" } })
						.then((tx) => tx.id + 1n)
						.catch(() => 0n)
					const tx = await txStore.get({ id: txId })
					if (!tx) {
						console.log(`Waiting for new tx ${txId.toString()}`)
						await new Promise((resolve) => setTimeout(resolve, 1000))
						return
					}

					console.log(`Indexing tx ${tx.id.toString()}`)

					const mutatorFactory = mutatorFactories[tx.mutatorName]
					if (!mutatorFactory) throw new Error(`Mutator ${tx.mutatorName} not found`)
					const mutator = mutatorFactory({ language: tx.language })
					const params = mutator.parser.parse(tx.params)
					const result = await mutator.call({ tx, params, db: prisma })

					await prisma.transaction.create({
						data: {
							id: tx.id,
							from: Buffer.from(tx.from),
							timestamp: tx.timestamp,
							result: Buffer.from(Bytes.encode(result)),
						},
					})

					console.log(`Indexed tx ${tx.id.toString()}`)
				})
			}
		},
	}
}

function createMutatorFactory() {
	return {
		parserFactory<TParser extends Database.Parser>(parserFactory: ({ language }: MutatorParserOptions) => TParser) {
			return {
				call<TReturns>(call: Database.Mutator.Call<Tx, TParser, TReturns>) {
					return (options: MutatorParserOptions): Database.Mutator<Tx, TParser, TReturns> => ({
						parser: parserFactory(options),
						call,
					})
				},
			}
		},
	}
}

const database = createDatabase({
	txStore: await createTxFileBasedStore({ dirname: "data" }),
	txIndexer: createTxPrismaIndexer({
		mutatorFactories: {
			"add-1": createMutatorFactory()
				.parserFactory(() => z.number())
				.call(async ({ params }) => {
					return params + 1
				}),
		},
		prisma: new PrismaClient(),
	}),
})
