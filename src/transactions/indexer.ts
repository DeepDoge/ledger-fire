import { prisma } from "@/prisma/client"
import { fromBytes } from "@/utils/bytes"
import colors from "colors"
import fs from "fs/promises"
import path from "path"
import type { Method } from "./methods"
import { methods } from "./methods"
import { transactionRequestDataZod } from "./transactionServer"

let nextTxId = (await prisma.indexing.findUnique({ where: { id: 0 } }))?.nextTxId ?? (await prisma.indexing.create({})).nextTxId

const logPrefixText = `[Indexer]` as const
const logPrefix = colors.green(logPrefixText)
const logPrefixEmpty = " ".repeat(logPrefixText.length)

export async function runIndexer() {
	console.log(logPrefix, "Indexer started")
	let indexingCache = true
	while (true) {
		await new Promise((resolve) => setTimeout(resolve, 100))
		const indexing = await indexNextTx()
		if (indexingCache === indexing) continue
		indexingCache = indexing
		if (!indexing) {
			console.log(logPrefix, `Waiting for next transaction...`)
			console.log(logPrefixEmpty, colors.gray("➜ "), colors.dim(`txId = ${nextTxId}`))
		}
	}
	console.log(logPrefix, "Indexer stopped")
}

async function indexNextTx() {
	const txId = nextTxId
	const txRequest = await fs.readFile(path.join("./transactions", ...txId.toString(36), "tx")).catch(() => null)
	if (!txRequest) return false

	try {
		await prisma.$transaction(async (prisma) => {
			const txRequestData = fromBytes(txRequest)
			const [methodName, params, from] = transactionRequestDataZod.parse(txRequestData)

			const tx = await prisma.transaction.create({
				data: {
					id: txId,
					from: Buffer.from(from),
					timestamp: Date.now(),
				},
			})

			console.log(logPrefix, `Indexing transaction`)
			console.log(logPrefixEmpty, colors.gray("➜ "), colors.dim(`txId = ${txId}`))
			console.log(logPrefixEmpty, colors.gray("➜ "), colors.dim(`method = ${methodName}`))
			console.log(logPrefixEmpty, colors.gray("➜ "), colors.dim(`from = ${from}`))

			const method = methods[methodName] as Method | undefined
			if (!method) throw new Error(`Unknown method ${methodName}`)

			await method.call(tx, prisma, params)
		})
	} catch (error) {
		console.log(logPrefix, colors.red(`Error while indexing transaction`))
		console.log(logPrefixEmpty, colors.gray("➜ "), colors.dim(`txId = ${txId}`))
		console.log(logPrefixEmpty, colors.red(`${error}`))
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
