import { fromBytes } from "@/utils/bytes.js"
import { prisma } from "../prisma/client.js"
import type { TransactionMethod } from "./methods.js"
import { methods } from "./methods.js"

let nextTxId = (await prisma.indexing.findUnique({ where: { id: 0 } }))?.nextTxId ?? (await prisma.indexing.create({})).nextTxId

export async function indexNextTx() {
	const txId = nextTxId

	const tx = await prisma.transaction.findUnique({ where: { id: txId } })
	if (!tx) return false

	console.log(`Indexing tx ${txId}`)

	const method: TransactionMethod = methods[tx.method as keyof typeof methods]
	if (!method) throw new Error(`Unknown method ${tx.method}`)

	const data = fromBytes(tx.data)
	if (!Array.isArray(data)) throw new Error("Invalid data")

	await prisma.$transaction(async (prisma) => {
		await method(tx, prisma, ...data)
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
	})

	return true
}
