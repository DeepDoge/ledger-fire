import express from "express"
import { indexNextTx } from "./indexer"
import { Transaction } from "./indexer/transaction"
import { handleServerRequest } from "./prisma/proxyServer"
import { fromBytes } from "./utils/bytes"

const api = express()

api.use(express.raw({ type: "application/octet-stream" }))

const PORT = 23450 as const

api.options("/prisma-proxy", (_, res) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "POST")
	res.header("Access-Control-Allow-Headers", "Content-Type")
	res.send()
})

api.post("/prisma-proxy", async (req, res) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "POST")
	res.header("Access-Control-Allow-Headers", "Content-Type")

	try {
		res.send(Buffer.from(await handleServerRequest(req.body)))
	} catch (error) {
		console.error(error)
		if (error instanceof Error) res.status(500).send(error.message)
		else res.status(500).send("Unknown error")
	}
})

api.options("/tx", (_, res) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "POST")
	res.header("Access-Control-Allow-Headers", "Content-Type")
	res.send()
})

api.post("/tx", async (req, res) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "POST")
	res.header("Access-Control-Allow-Headers", "Content-Type")

	try {
		const args = fromBytes(req.body)
		if (!Array.isArray(args)) throw new Error("Expected array of arguments")
		const [method, data, from] = args
		if (typeof method !== "string") throw new Error("Expected string as method name")
		if (!(data instanceof Uint8Array)) throw new Error("Expected Uint8Array as data payload")
		if (!(from instanceof Uint8Array)) throw new Error("Expected Uint8Array as from address")

		res.send(await Transaction.create(method, data, from))
	} catch (error) {
		console.error(error)
		if (error instanceof Error) res.status(500).send(error.message)
		else res.status(500).send("Unknown error")
	}
})

api.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})

new Promise(async () => {
	while (true) {
		await new Promise((resolve) => setTimeout(resolve, 0))
		await indexNextTx()
	}
})
