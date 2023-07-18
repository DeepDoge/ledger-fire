import { API_URL } from "@/config"
import { toBytes } from "@/utils/bytes"
import type { MethodParameters, methods } from "./methods"
import type { TransactionRequestData } from "./transactionServer"

export const transaction = new Proxy(() => {}, {
	get<K extends keyof typeof methods>(_: never, methodKey: K) {
		return async (...args: unknown[]) => {
			const requestData: TransactionRequestData = [methodKey, args, new Uint8Array(0)]
			await fetch(`${API_URL}/tx`, {
				method: "POST",
				body: toBytes(requestData),
				headers: {
					"Content-Type": "application/octet-stream",
				},
			})
		}
	},
}) as unknown as {
	[K in keyof typeof methods]: (...args: MethodParameters<(typeof methods)[K]>) => ReturnType<(typeof methods)[K]>
}
