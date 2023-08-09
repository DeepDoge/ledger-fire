import type { PrismaClient } from "@prisma/client"
import { z } from "zod"

export const pathTokenZod = z.union([
	z.object({
		type: z.literal("property"),
		prop: z.string(),
	}),
	z.object({
		type: z.literal("call"),
		args: z.array(z.unknown()),
	}),
])

export type PathToken = z.infer<typeof pathTokenZod>

const allowedMethods = ["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany"] as const satisfies readonly Exclude<
	{
		[K in Exclude<keyof PrismaClient, `$${string}` | symbol>]: keyof PrismaClient[K]
	}[Exclude<keyof PrismaClient, `$${string}` | symbol>],
	symbol
>[]
export type AllowedMethod = (typeof allowedMethods)[number]
const allowedMethodsSet = new Set(allowedMethods)
export { allowedMethodsSet as allowedMethods }

export function accessCheck(path: PathToken[], prop: unknown): asserts prop is string {
	if (typeof prop !== "string") throw new Error("Not Allowed")
	if (path.length === 0 && prop.startsWith("$")) throw new Error("Not Allowed")
	if (path.length === 1 && !allowedMethodsSet.has(prop)) throw new Error("Not Allowed")
}
