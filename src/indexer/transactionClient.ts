import { API_URL } from "@/config"
import { toBytes } from "@/utils/bytes"
import type { Call, Tuples } from "hotscript"
import type { methods } from "./methods"
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
	[K in keyof typeof methods]: (...args: Call<Tuples.Drop<2>, Parameters<(typeof methods)[K]>>) => ReturnType<(typeof methods)[K]>
}
