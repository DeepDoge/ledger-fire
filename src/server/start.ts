import type { Prisma } from "@prisma/client"
import { prisma } from "../prisma/client.js"

export type Transaction = Prisma.TransactionGetPayload<{}>
export namespace Transaction {
	export async function create(method: string, data: Uint8Array, from: Uint8Array) {
		await prisma.transaction.create({
			data: {
				method,
				data: Buffer.from(data),
				from: Buffer.from(from),
			},
		})
	}
}
