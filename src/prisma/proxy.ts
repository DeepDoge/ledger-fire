export type PathToken =
	| {
			type: "property"
			prop: string
	  }
	| {
			type: "call"
			args: unknown[]
	  }

export const allowedOperations = ["findUnique", "findFirst", "findMany"] as const
export type AllowedOperation = (typeof allowedOperations)[number]
const allowedOperationsSet = new Set(allowedOperations)

export function accessCheck(path: PathToken[], prop: unknown): asserts prop is string {
	if (typeof prop !== "string") throw new Error("Not Allowed")
	if (path.length === 0 && prop.startsWith("$")) throw new Error("Not Allowed")
	if (path.length === 1 && !allowedOperationsSet.has(prop)) throw new Error("Not Allowed")
}
