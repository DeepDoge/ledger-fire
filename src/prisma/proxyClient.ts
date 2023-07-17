import { fromBytes, toBytes } from "@/utils/bytes"
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
	const response = await fetch("https://deepdoge-redesigned-doodle-59gj7r54627p7j-23450.preview.app.github.dev/prisma-proxy", {
		method: "POST",
		body: toBytes(path),
		headers: {
			"Content-Type": "application/octet-stream",
		},
	})

	if (!response.ok) throw new Error("Server error")
	const bytes = new Uint8Array(await response.arrayBuffer())
	return fromBytes(bytes)
}

export const prismaProxy = PrismaClientReadonlyProxy.createClient()
