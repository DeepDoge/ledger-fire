import type { PrismaClient } from "@prisma/client"

type PathToken =
	| {
			type: "property"
			prop: string
	  }
	| {
			type: "function"
			args: unknown[]
	  }

function callRemote(path: PathToken[]): unknown {
	throw new Error("Not implemented")
}

const allowedOperations = ["findUnique", "findFirst", "findMany"] as const
type AllowedOperation = (typeof allowedOperations)[number]
const allowedOperationsSet = new Set(allowedOperations)

function createPathProxy(path: PathToken[] = []): unknown {
	return new Proxy(
		{},
		{
			get(_, prop) {
				const p = String(prop)

				if (path.length === 0 && p.startsWith("$")) throw new Error("Not Allowed")
				if (path.length === 1 && !allowedOperationsSet.has(p)) throw new Error("Not Allowed")

				return createPathProxy([...path, { type: "property", prop: p }])
			},
			apply(_, __, args) {
				return callRemote([...path, { type: "function", args }])
			},
		}
	)
}

type ReadonlyPrismaClient = {
	[K in Exclude<keyof PrismaClient, `$${string}` | symbol>]: {
		[K2 in AllowedOperation]: PrismaClient[K][K2]
	}
}

export const readonlyPrisma = createPathProxy() as ReadonlyPrismaClient
