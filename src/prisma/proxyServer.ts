import { fromBytes, toBytes } from "@/utils/bytes"
import { prisma } from "./client"
import { accessCheck, type PathToken } from "./proxy"

export async function handlePrismaProxyServerRequest(data: Uint8Array): Promise<Uint8Array> {
	const path = fromBytes(data) as PathToken[]
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

	return toBytes(current)
}
