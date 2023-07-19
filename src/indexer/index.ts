import { fromBytes } from "@/utils/bytes.js"
import { prisma } from "../prisma/client.js"
import type { Method } from "./methods.js"
import { methods } from "./methods.js"

let nextTxId = (await prisma.indexing.findUnique({ where: { id: 0 } }))?.nextTxId ?? (await prisma.indexing.create({})).nextTxId

export async function indexNextTx() {
	const txId = nextTxId
	const tx = await prisma.transaction.findUnique({ where: { id: txId } })
	if (!tx) return false

	try {
		console.log(`Indexing tx ${txId}`)
		const method = (methods as Record<PropertyKey, Method>)[tx.method]
		if (!method) throw new Error(`Unknown method ${tx.method}`)
		const params = method.$params.parseOrThrow(fromBytes(tx.data))

		await method.call(tx, prisma, params)
	} catch (error) {
		console.error(`Failed to index tx ${txId}`)
		console.error(error)
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
