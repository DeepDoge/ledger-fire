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
	)?.id ?? 0

export async function indexNextTx() {
	const txId = lastTxId

	const tx = await prisma.transaction.findUnique({ where: { id: txId } })
	if (!tx) return false

	const method = methods[tx.method]
	if (!method) throw new Error(`Unknown method ${tx.method}`)

	const data = fromBytes(tx.data)
	if (!Array.isArray(data)) throw new Error("Invalid data")

	await method(tx, ...data)

	lastTxId++
	return true
}
