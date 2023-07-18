export function hexToBytes(hex: string): Uint8Array {
	if (hex.startsWith("0x")) hex.slice(2)

	if (hex.length % 2 !== 0) hex = `0${hex}`
	const bytes = new Uint8Array(hex.length / 2)
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
	}
	return bytes
}

export function bytesToHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")}`
}

export function toBytes(data: unknown): Uint8Array {
	switch (typeof data) {
		case "string":
			return new Uint8Array([0, ...new TextEncoder().encode(data)])
		case "number":
			return new Uint8Array([1, ...hexToBytes(data.toString(16))])
		case "bigint":
			return new Uint8Array([2, ...hexToBytes(data.toString(16))])
		case "boolean":
			return new Uint8Array([3, data ? 1 : 0])
		case "undefined":
			return new Uint8Array([9])
		case "object":
			if (data === null) return new Uint8Array([4])
			if (Array.isArray(data)) {
				return new Uint8Array([
					5,
					...data
						.map((item) => {
							const bytes = toBytes(item)
							const result = new Uint8Array(bytes.length + 4)
							new DataView(result.buffer).setUint32(0, bytes.length, false)
							result.set(bytes, 4)
							return [...result]
						})
						.flat(),
				])
			}

			if (data instanceof Uint8Array) return new Uint8Array([7, ...data])
			if (data instanceof Date) return new Uint8Array([8, ...hexToBytes(data.getTime().toString(16))])

			return new Uint8Array([6, ...toBytes(Object.entries(data))])
		default:
			throw new Error(`Unsupported type ${typeof data}`)
	}
}

export function fromBytes(bytes: Uint8Array): unknown {
	const type = bytes[0]
	const data = new Uint8Array([...bytes.subarray(1)])

	switch (type) {
		case 0:
			return new TextDecoder().decode(data)
		case 1:
			return parseInt(bytesToHex(data), 16)
		case 2:
			return BigInt(bytesToHex(data))
		case 3:
			return data[0] === 1
		case 4:
			return null
		case 5:
			const result: unknown[] = []
			let offset = 0
			while (offset < data.length) {
				const length = new DataView(data.buffer).getUint32(offset, false)
				offset += 4

				const item = fromBytes(data.slice(offset, offset + length))
				offset += length

				result.push(item)
			}
			return result
		case 6:
			return Object.fromEntries(fromBytes(data) as [string, unknown][])
		case 7:
			return data
		case 8:
			return new Date(parseInt(bytesToHex(data), 16))
		case 9:
			return undefined
		default:
			throw new Error(`Unsupported type ${type}`)
	}
}
