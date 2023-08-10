import { API_PORT } from "@/config"
import { PrismaProxy } from "@/prisma/proxy"
import { runIndexer } from "@/transactions/indexer"
import colors from "colors"
import express from "express"
import { handleTransactionServerRequest } from "./transactions/transactionServer"

const api = express()

api.use(express.raw({ type: "application/octet-stream" }))
handlePath("/prisma-proxy", PrismaProxy.handleRequest)
handlePath("/tx", handleTransactionServerRequest)

api.listen(API_PORT, async () => {
	console.log()
	console.log(colors.bgGreen(" API Server "), colors.dim(`Listening on port`), colors.white(`${API_PORT}`))
	console.log()
	console.log(colors.green(" ➜ "), colors.white("Local:"), colors.cyan(`http://localhost:${API_PORT}`))
	console.log()
	runIndexer()
})

function applyHeaders(res: express.Response) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Methods", "POST")
	res.header("Access-Control-Allow-Headers", "Content-Type")
}

function handlePath(path: string, handler: (body: Uint8Array) => Promise<Uint8Array>) {
	api.options(path, (_, res) => {
		applyHeaders(res)
		res.send()
	})

	api.post(path, async (req, res) => {
		applyHeaders(res)

		try {
			res.send(Buffer.from(await handler(req.body)))
		} catch (error) {
			console.error(error)
			if (error instanceof Error) res.status(500).send(error.message)
			else res.status(500).send("Unknown error")
		}
	})
}
