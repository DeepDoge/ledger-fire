export type PathToken =
	| {
			type: "property"
			prop: string
	  }
	| {
			type: "call"
			args: unknown[]
	  }

const allowedMethods = ["findUnique", "findFirst", "findMany"] as const
export type AllowedMethod = (typeof allowedMethods)[number]
const allowedMethodsSet = new Set(allowedMethods)
export { allowedMethodsSet as allowedMethods }

export function accessCheck(path: PathToken[], prop: unknown): asserts prop is string {
	if (typeof prop !== "string") throw new Error("Not Allowed")
	if (path.length === 0 && prop.startsWith("$")) throw new Error("Not Allowed")
	if (path.length === 1 && !allowedMethodsSet.has(prop)) throw new Error("Not Allowed")
}
