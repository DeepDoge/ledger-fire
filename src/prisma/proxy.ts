import { API_URL } from "@/config"
import { Bytes } from "@/utils/bytes"
import type { PrismaClient } from "@prisma/client"
import { z } from "zod"
let prismaImport: PrismaClient | null = null
const prisma = async () => (prismaImport ??= await import("@/prisma/client").then((m) => m.prisma))

/* 

	If you are asking: 
	- "Why this big file exists and not separated into multiple files?" 
	- "Why do I import some stuff async and not at the top of the file?"
	
	Then the answer is: Blame ES6 modules, and lack of good namespace support with ES6 modules in TypeScript.
		Because without namespace support, I either separate this file into multiple files and then have to export internal stuff,
		or I put everything in one file and then I don't have to export internal stuff.

*/

export type PrismaProxy = {
	[K in Exclude<keyof PrismaClient, `$${string}` | symbol>]: {
		[K2 in AllowedMethod]: PrismaClient[K][K2]
	}
}
export namespace PrismaProxy {
	export function createClient(): PrismaProxy {
		return createProxy() as PrismaProxy
	}

	export async function handleRequest(data: Uint8Array): Promise<Uint8Array> {
		const path = z.array(pathTokenZod).parse(Bytes.decode(data))

		let current = await prisma()
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
}

export const prismaProxy = PrismaProxy.createClient()

const allowedMethods = ["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany"] as const satisfies PrismaMethod
type AllowedMethod = (typeof allowedMethods)[number]

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

const pathTokenZod = z.union([
	z.object({
		type: z.literal("property"),
		prop: z.string(),
	}),
	z.object({
		type: z.literal("call"),
		args: z.array(z.unknown()),
	}),
])

type PathToken = z.infer<typeof pathTokenZod>

type PrismaMethod = readonly Exclude<
	{
		[K in Exclude<keyof PrismaClient, `$${string}` | symbol>]: keyof PrismaClient[K]
	}[Exclude<keyof PrismaClient, `$${string}` | symbol>],
	symbol
>[]

const allowedMethodsSet = new Set(allowedMethods)
function accessCheck(path: PathToken[], prop: unknown): asserts prop is string {
	if (typeof prop !== "string") throw new Error("Not Allowed")
	if (path.length === 0 && prop.startsWith("$")) throw new Error("Not Allowed")
	if (path.length === 1 && !allowedMethodsSet.has(prop)) throw new Error("Not Allowed")
}
