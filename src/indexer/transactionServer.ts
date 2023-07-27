import { fromBytes, toBytes } from "@/utils/bytes"
import fs from "fs/promises"
import path from "path"
import type { $infer } from "type-spirit/library"
import { $instanceOf, $literal, $tuple, $union, $unknown } from "type-spirit/library"
import { methods } from "./methods"

export const $transactionRequestData = $tuple(
	$union(...(Object.keys(methods) as (keyof typeof methods)[]).map((key) => $literal(key))),
	$unknown(),
	$instanceOf(Uint8Array)
)
export type TransactionRequestData = $infer<typeof $transactionRequestData>

// We get the id from ./transactions/id file, if the path doesn't exist, id = 0n
// Every time we handle a request, we increment the id and write it to the file

let id = 0n

try {
	id = BigInt(await fs.readFile("./transactions/id", "utf-8"))
} catch {}

export async function handleTransactionServerRequest(request: Uint8Array): Promise<Uint8Array> {
	const data = fromBytes(request)
	$transactionRequestData.parseOrThrow(data)

	// convert id to base64 and save the request bytes inside file, the path start from transactions/ folder and every letter is a folder except last letter if a file
	const pathToTx = path.join("./transactions", ...id.toString(36))
	await fs.mkdir(pathToTx, { recursive: true })
	await fs.writeFile(path.join(pathToTx, "tx"), request)

	// increment id and save it to file
	id++
	await fs.writeFile("./transactions/id", id.toString())

	return toBytes(id)
}
