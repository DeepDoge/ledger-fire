import { Bytes } from "@/utils/bytes"
import { z } from "zod"
import { prisma } from "./client"
import { accessCheck, pathTokenZod, type PathToken } from "./proxy"

export async function handlePrismaProxyServerRequest(data: Uint8Array): Promise<Uint8Array> {
	const path = z.array(pathTokenZod).parse(Bytes.decode(data))

	let current = prisma
	for (const token of path) {
		if (token.type === "property") accessCheck(path, token.prop)
		switch (token.type) {
			case "property":
				current = (current as any)[token.prop]
				break
			case "call":
				current = await (current as any)(...token.args)
				break
			default:
				throw new Error(`Unsupported token type ${(token as PathToken).type}`)
		}
	}

	return Bytes.encode(current)
}
