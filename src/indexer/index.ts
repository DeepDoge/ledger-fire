import { fromBytes } from "@/utils/bytes.js"
import { prisma } from "../prisma/client.js"
import { methods } from "./methods.js"

let lastTxId =
	(
		await prisma.transaction.findFirst({
			orderBy: {
				id: "desc",
			},
			select: {
				id: true,
			},
		})
	)?.id ?? -1n

export async function indexNextTx() {
	const txId = lastTxId + 1n

	const tx = await prisma.transaction.findUnique({ where: { id: txId } })
	if (!tx) return false

	const method = methods[tx.method]
	if (!method) throw new Error(`Unknown method ${tx.method}`)

	const data = fromBytes(tx.data)
	if (!Array.isArray(data)) throw new Error("Invalid data")

	await prisma.$transaction(async (prisma) => {
		await method(tx, prisma, ...data)
		await prisma.indexing.update({
			where: { id: 0 },
			data: { lastIndexedTxId: txId },
		})
		lastTxId = txId
	})

	return true
}
