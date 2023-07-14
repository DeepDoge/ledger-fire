import type { PrismaClient } from "@prisma/client"

type PathToken = {
	prop: string
} & (
	| {
			type: "property"
	  }
	| {
			type: "function"
			args: unknown[]
	  }
)

function callRemote(path: PathToken[]): unknown {
	throw new Error("Not implemented")
}

const allowedOperations = ["findUnique", "findFirst", "findMany"] as const
type AllowedOperation = (typeof allowedOperations)[number]
const allowedOperationsSet = new Set(allowedOperations)

function accessCheck(path: PathToken[], prop: unknown): asserts prop is string {
	if (typeof prop !== "string") throw new Error("Not Allowed")
	if (path.length === 0 && prop.startsWith("$")) throw new Error("Not Allowed")
	if (path.length === 1 && !allowedOperationsSet.has(prop)) throw new Error("Not Allowed")
}

function createPathProxy(path: PathToken[] = []): unknown {
	return new Proxy(
		{},
		{
			get(_, prop: unknown) {
				accessCheck(path, prop)
				return createPathProxy([...path, { type: "property", prop }])
			},
			apply(_, prop: unknown, args: unknown[]) {
				accessCheck(path, prop)
				return callRemote([...path, { type: "function", prop, args }])
			},
		}
	)
}

type ReadonlyPrismaClient = {
	[K in Exclude<keyof PrismaClient, `$${string}` | symbol>]: {
		[K2 in AllowedOperation]: PrismaClient[K][K2]
	}
}

export const readonlyPrismaClientProxy = createPathProxy() as ReadonlyPrismaClient
