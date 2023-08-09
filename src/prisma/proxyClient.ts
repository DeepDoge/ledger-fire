import { API_URL } from "@/config"
import { Bytes } from "@/utils/bytes"
import type { PrismaClient } from "@prisma/client"
import { accessCheck, type AllowedMethod, type PathToken } from "./proxy"

export type PrismaClientReadonlyProxy = {
	[K in Exclude<keyof PrismaClient, `$${string}` | symbol>]: {
		[K2 in AllowedMethod]: PrismaClient[K][K2]
	}
}
export namespace PrismaClientReadonlyProxy {
	export function createClient(): PrismaClientReadonlyProxy {
		return createProxy() as PrismaClientReadonlyProxy
	}
}

function createProxy(path: PathToken[] = []): unknown {
	return new Proxy(() => {}, {
		get(_, prop) {
			accessCheck(path, prop)
			return createProxy([...path, { type: "property", prop }])
		},
		apply(_, __, args) {
			return callRemote([...path, { type: "call", args }])
		},
	})
}

async function callRemote(path: PathToken[]) {
	const response = await fetch(`${API_URL}/prisma-proxy`, {
		method: "POST",
		body: Bytes.encode(path),
		headers: {
			"Content-Type": "application/octet-stream",
		},
	})

	if (!response.ok) throw new Error("Server error")
	const bytes = new Uint8Array(await response.arrayBuffer())
	return Bytes.decode(bytes)
}

export const prismaProxy = PrismaClientReadonlyProxy.createClient()
