import type { PrismaClient } from "@prisma/client"
import type { $infer } from "type-spirit/library"
import { $array, $literal, $object, $string, $union, $unknown } from "type-spirit/library"

export const $pathToken = $union(
	$object({ type: $literal("property"), prop: $string() }),
	$object({ type: $literal("call"), args: $array($unknown()) })
)

export type PathToken = $infer<typeof $pathToken>

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
