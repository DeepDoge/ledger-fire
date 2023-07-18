import { fromBytes, toBytes } from "@/utils/bytes.js"
import { prisma } from "../prisma/client.js"
import type { methods } from "./methods.js"

export type TransactionRequestData = [methodKey: keyof typeof methods, args: unknown[], from: Uint8Array]

let nextId =
	(
		await prisma.transaction.findFirst({
			orderBy: { id: "desc" },
			select: { id: true },
		})
	)?.id ?? 0n

export async function handleTransactionServerRequest(request: Uint8Array): Promise<Uint8Array> {
	const [method, args, from] = fromBytes(request) as TransactionRequestData

	const id = (
		await prisma.transaction.create({
			select: { id: true },
			data: {
				id: nextId++,
				method,
				data: Buffer.from(toBytes(args)),
				from: Buffer.from(from),
				timestamp: BigInt(Date.now()),
			},
		})
	).id

	return toBytes(id)
}
