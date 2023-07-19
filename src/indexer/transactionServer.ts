import { $bytes } from "@/utils/$types.js"
import { fromBytes, toBytes } from "@/utils/bytes.js"
import type { $infer } from "type-spirit/library/index.js"
import { $literal, $tuple, $union, $unknown } from "type-spirit/library/index.js"
import { prisma } from "../prisma/client.js"
import { methods } from "./methods.js"

export const $transactionRequestData = $tuple(
	$union(...(Object.keys(methods) as (keyof typeof methods)[]).map((key) => $literal(key))),
	$unknown(),
	$bytes()
)
export type TransactionRequestData = $infer<typeof $transactionRequestData>

let nextId =
	((
		await prisma.transaction.findFirst({
			orderBy: { id: "desc" },
			select: { id: true },
		})
	)?.id ?? -1n) + 1n

export async function handleTransactionServerRequest(request: Uint8Array): Promise<Uint8Array> {
	const [method, params, from] = $transactionRequestData.parseOrThrow(fromBytes(request))

	const id = (
		await prisma.transaction.create({
			select: { id: true },
			data: {
				id: nextId,
				method,
				data: Buffer.from(toBytes(params)),
				from: Buffer.from(from),
				timestamp: BigInt(Date.now()),
			},
		})
	).id

	nextId = id + 1n

	return toBytes(id)
}
