import { $type } from "type-spirit/library"

export const $bytes = $type((value): asserts value is Uint8Array => {
	if (!(value instanceof Uint8Array)) throw new Error("Not a Uint8Array")
})
