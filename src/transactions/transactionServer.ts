import { Bytes } from "@/utils/bytes"
import fs from "fs/promises"
import path from "path"
import { z } from "zod"
import { methods } from "./methods"

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never
type Push<T extends any[], V> = [...T, V]
type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

export const transactionRequestDataZod = z.tuple([
	z.enum(Object.keys(methods) as TuplifyUnion<keyof typeof methods>),
	z.unknown(),
	z.instanceof(Uint8Array),
])
export type TransactionRequestData = z.infer<typeof transactionRequestDataZod>

// We get the id from ./transactions/id file, if the path doesn't exist, id = 0n
// Every time we handle a request, we increment the id and write it to the file

let id = 0n

try {
	id = BigInt(await fs.readFile("./transactions/id", "utf-8"))
} catch {}

export async function handleTransactionServerRequest(request: Uint8Array): Promise<Uint8Array> {
	const data = Bytes.decode(request)
	transactionRequestDataZod.parse(data)

	// convert id to base64 and save the request bytes inside file, the path start from transactions/ folder and every letter is a folder except last letter if a file
	const pathToTx = path.join("./transactions", ...id.toString(36))
	await fs.mkdir(pathToTx, { recursive: true })
	await fs.writeFile(path.join(pathToTx, "tx"), request)

	// increment id and save it to file
	id++
	await fs.writeFile("./transactions/id", id.toString())

	return Bytes.encode(id)
}
