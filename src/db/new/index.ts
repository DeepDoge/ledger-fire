import { Bytes } from "@/utils/bytes"
import { PrismaClient } from "@prisma/client"
import colors from "colors/safe"
import express from "express"
import { Database } from "./database"
import { FileBasedTxStore } from "./implementation/fileBasedTxStore"
import { PrismaTxIndexer } from "./implementation/prismaTxIndexer"
import { PrismaTxOperationFactory } from "./implementation/prismaTxOperationFactory"
import { dbOperations } from "./operations"

const LOG_PREFIX_TEXT = `[Database]` as const
const LOG_PREFIX = colors.green(LOG_PREFIX_TEXT)
const LOG_PREFIX_EMPTY = " ".repeat(LOG_PREFIX_TEXT.length)

const API_PORT = 23450 as const

const MUTATE_PATH = "/db/mutate" as const
const QUERY_PATH = "/db/query" as const

const txStore = await FileBasedTxStore.create({ dirname: "data" })
const operationFactory = PrismaTxOperationFactory.create({ operations: dbOperations })

const prisma = new PrismaClient()
const txIndexer = PrismaTxIndexer.create({
	prisma,
	txStore,
	operationFactory,
})

const api = express()

api.use(express.raw({ type: "application/octet-stream" }))

handlePath(MUTATE_PATH, async ({ body }) => {
	if (!(body instanceof Uint8Array)) throw new Error("Request body must be a Uint8Array")
	const txRequest = Database.TxRequest.parser.parse(Bytes.decode(body))
	const tx = await txStore.add({ txRequest })
	return Bytes.encode(tx.id)
})

handlePath(QUERY_PATH, async ({ body }) => {
	throw new Error("Not implemented")
})

api.listen(API_PORT, () => {
	console.log(`${LOG_PREFIX} Listening on port ${API_PORT}`)
	txIndexer.start()
})

function applyHeaders(res: express.Response) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "POST")
	res.header("Access-Control-Allow-Headers", "Content-Type")
}

function handlePath(path: string, handler: (request: express.Request) => Promise<Uint8Array>) {
	api.options(path, (_, res) => {
		applyHeaders(res)
		res.send()
	})

	api.post(path, async (req, res) => {
		applyHeaders(res)

		try {
			res.send(Buffer.from(await handler(req)))
		} catch (error) {
			console.error(error)
			if (error instanceof Error) res.status(500).send(error.message)
			else res.status(500).send("Unknown error")
		}
	})
}
