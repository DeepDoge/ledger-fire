import { prisma } from "@/prisma/client"
import { Bytes } from "@/utils/bytes"
import colors from "colors"
import fs from "fs/promises"
import path from "path"
import type { Method } from "./methods"
import { methods } from "./methods"
import { transactionRequestDataZod } from "./transactionServer"

let nextTxId = (await prisma.indexing.findUnique({ where: { id: 0 } }))?.nextTxId ?? (await prisma.indexing.create({})).nextTxId

const LOG_PREFIX_TEXT = `[Indexer]` as const
const LOG_PREFIX = colors.green(LOG_PREFIX_TEXT)
const LOG_PREFIX_EMPTY = " ".repeat(LOG_PREFIX_TEXT.length)

export async function runIndexer() {
	console.log(LOG_PREFIX, "Indexer started")
	let indexingCache = true
	while (true) {
		const indexing = await indexNextTx()
		if (indexingCache === indexing) continue
		indexingCache = indexing
		if (!indexing) {
			console.log(LOG_PREFIX, `Waiting for next transaction...`)
			console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`txId = ${nextTxId}`))
			await new Promise((resolve) => setTimeout(resolve, 500))
		}
	}
	console.log(LOG_PREFIX, "Indexer stopped")
}

async function indexNextTx() {
	const txId = nextTxId
	const txRequest = await fs.readFile(path.join("./transactions", ...txId.toString(36), "tx")).catch(() => null)
	if (!txRequest) return false

	try {
		await prisma.$transaction(async (prisma) => {
			const txRequestData = Bytes.decode(txRequest)
			const [methodName, params, from] = transactionRequestDataZod.parse(txRequestData)

			const tx = await prisma.transaction.create({
				data: {
					id: txId,
					from: Buffer.from(from),
					timestamp: Date.now(),
				},
			})

			console.log(LOG_PREFIX, `Indexing transaction`)
			console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`txId = ${txId}`))
			console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`method = ${methodName}`))
			console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`from = ${from}`))

			const method = methods[methodName] as Method | undefined
			if (!method) throw new Error(`Unknown method ${methodName}`)

			await method.call(tx, prisma, params)
		})
	} catch (error) {
		console.log(LOG_PREFIX, colors.red(`Error while indexing transaction`))
		console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`txId = ${txId}`))
		console.log(LOG_PREFIX_EMPTY, colors.red(`${error}`))
	}

	nextTxId = (
		await prisma.indexing.update({
			select: { nextTxId: true },
			where: { id: 0 },
			data: {
				nextTxId: {
					increment: 1n,
				},
			},
		})
	).nextTxId

	return true
}
