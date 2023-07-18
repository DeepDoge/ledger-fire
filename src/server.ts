import express from "express"
import { indexNextTx } from "./indexer"
import { handleTransactionServerRequest } from "./indexer/transactionServer"
import { handlePrismaProxyServerRequest } from "./prisma/proxyServer"

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
		res.send(Buffer.from(await handlePrismaProxyServerRequest(req.body)))
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
		res.send(Buffer.from(await handleTransactionServerRequest(req.body)))
	} catch (error) {
		console.error(error)
		if (error instanceof Error) res.status(500).send(error.message)
		else res.status(500).send("Unknown error")
	}
})

api.listen(PORT, async () => {
	console.log(`Server is running on http://localhost:${PORT}`)

	console.log("Indexing transactions...")
	while (true) {
		await new Promise((resolve) => setTimeout(resolve, 100))
		await indexNextTx()
	}
})
