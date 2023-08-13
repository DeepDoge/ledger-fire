import type { Prisma } from "@prisma/client"

export type Database = {
	handleTxRequest(params: { headers: Database.Headers; body: unknown }): Promise<Uint8Array>
	handleQueryRequest(params: { headers: Database.Headers; body: unknown }): Promise<Uint8Array>
	startIndexer(): Promise<void>
}
export namespace Database {
	export type Headers = Record<string, string>

	export type TxStore<TxRequest, Tx> = {
		add(params: { txRequest: TxRequest }): Promise<Tx>
		get(params: { id: bigint }): Promise<Tx | null>
	}

	export type TxIndexer<TxRequest, Tx> = { start(params: { txStore: TxStore<TxRequest, Tx> }): Promise<void> }

	export type Parser<T = unknown> = {
		parse: (data: unknown) => T
	}
	export namespace Parser {
		export type Infer<TParser extends Parser> = ReturnType<TParser["parse"]>
	}

	export type Mutator<Tx, TParser extends Parser, TReturns> = {
		parser: TParser
		call: Mutator.Call<Tx, TParser, TReturns>
	}
	export namespace Mutator {
		export type Call<Tx, TParser extends Parser, TReturns> = (options: {
			tx: Tx
			db: Prisma.TransactionClient
			params: Parser.Infer<TParser>
		}) => Promise<TReturns>
	}
}
