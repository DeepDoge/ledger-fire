import { API_URL } from "@/config"
import { Bytes } from "@/utils/bytes"
import type { z } from "zod"
import type { methods } from "./methods"
import type { TransactionRequestData } from "./transactionServer"

export const transaction = new Proxy(() => {}, {
	get<K extends keyof typeof methods>(_: never, methodKey: K) {
		return async (params: unknown) => {
			const requestData: TransactionRequestData = [methodKey, params, new Uint8Array(0)]
			await fetch(`${API_URL}/tx`, {
				method: "POST",
				body: Bytes.encode(requestData),
				headers: {
					"Content-Type": "application/octet-stream",
				},
			})
		}
	},
}) as unknown as {
	[K in keyof typeof methods]: (params: z.infer<(typeof methods)[K]["zod"]>) => ReturnType<(typeof methods)[K]["call"]>
}
