import { Prisma, PrismaClient } from "@prisma/client"
import colors from "colors/safe"
import { Bytes } from "common/utils/bytes"
import { ApiConfig } from "./config"
import { Database } from "./database"
import { FileBasedTxStore } from "./implementation/fileBasedTxStore"
import { PrismaTxIndexer } from "./implementation/prismaTxIndexer"
import { PrismaTxMutationFactory } from "./implementation/prismaTxMutationFactory"
import { mutations } from "./mutations"

export interface ApiServer {
	handle(request: Request): Promise<Response>
}
export namespace ApiServer {
	export async function start(): Promise<ApiServer> {
		const LOG_PREFIX_TEXT = `[Database]` as const
		const LOG_PREFIX = colors.green(LOG_PREFIX_TEXT)
		const LOG_PREFIX_EMPTY = " ".repeat(LOG_PREFIX_TEXT.length)

		console.log(`${LOG_PREFIX} Starting API server...`)

		const txStore = (await FileBasedTxStore.create({ dirname: "data" })) satisfies Database.TxStore
		const mutationFactory = PrismaTxMutationFactory.create({ mutations: mutations }) satisfies Database.TxMutationFactory

		const prisma = new PrismaClient()
		const txIndexer = PrismaTxIndexer.create({
			prisma,
			txStore,
			mutationFactory,
		}) satisfies Database.TxIndexer

		txIndexer.start()

		return {
			async handle(request) {
				const url = new URL(request.url)
				const body = new Uint8Array(await request.arrayBuffer())

				let responseBody: Uint8Array
				try {
					if (url.pathname === ApiConfig.TX_PATH) {
						const txRequest = Database.TxRequest.Parser.parse(Bytes.decode(body))
						const tx = await txStore.add({ txRequest })
						responseBody = Bytes.encode(tx.id)
					} else if (url.pathname === ApiConfig.QUERY_PATH) {
						const queryRequest = Database.QueryRequest.Parser.parse(Bytes.decode(body))

						let current = prisma[queryRequest.table as keyof Prisma.TransactionClient] as unknown
						if (!current) return new Response("Table not found", { status: 404 })

						for (const path of queryRequest.path) current = current![path as keyof typeof current]

						const response = await (current as Function)(...queryRequest.args)
						responseBody = Bytes.encode(response)
					} else return new Response("Not found", { status: 404 })

					return new Response(responseBody, {
						headers: {
							"Access-Control-Allow-Origin": "*",
							"Access-Control-Allow-Methods": "POST",
							"Access-Control-Allow-Headers": "Content-Type",
							"Content-Type": "application/octet-stream",
						},
					})
				} catch (error) {
					console.error(error)
					return new Response(error instanceof Error ? error.message : String(error), { status: 500 })
				}
			},
		}
	}
}
