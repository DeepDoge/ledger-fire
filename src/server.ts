import colors from "colors"
import express from "express"
import { API_PORT } from "./config"
import { runIndexer } from "./indexer"
import { handleTransactionServerRequest } from "./indexer/transactionServer"
import { handlePrismaProxyServerRequest } from "./prisma/proxyServer"

const api = express()

api.use(express.raw({ type: "application/octet-stream" }))

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

api.listen(API_PORT, async () => {
	console.log()
	console.log(colors.bgGreen(" API Server "), colors.dim(`Listening on port`), colors.white(`${API_PORT}`))
	console.log()
	console.log(colors.green("➜ "), colors.white("Local:"), colors.cyan(`http://localhost:${API_PORT}`))
	console.log()
	runIndexer()
})
