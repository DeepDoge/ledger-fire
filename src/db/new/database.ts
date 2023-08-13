import { z } from "zod"

export namespace Database {
	export type TxRequest = Parser.Infer<typeof TxRequest.parser>
	export namespace TxRequest {
		export const parser = z.object({
			operation: z.object({
				name: z.string(),
				params: z.unknown(),
			}),
			from: z.instanceof(Uint8Array),
			language: z.string(),
		}) satisfies Parser
	}
	export type Tx = Parser.Infer<typeof Tx.parser>
	export namespace Tx {
		export const parser = z.intersection(
			TxRequest.parser,
			z.object({
				id: z.bigint(),
				timestamp: z.number(),
			})
		) satisfies Parser
	}

	export type TxStore = {
		add(params: { txRequest: TxRequest }): Promise<Tx>
		get(params: { id: bigint }): Promise<Tx | null>
	}

	export type TxIndexer = { start(): Promise<void> }

	export type Parser<T = unknown> = {
		parse: (data: unknown) => T
	}
	export namespace Parser {
		export type Infer<TParser extends Parser> = ReturnType<TParser["parse"]>
	}

	export type TxOperation<TDb = any /* TODO: try to get rid of this `any` */, TParamsParser extends Parser = Parser, TReturns = unknown> = {
		paramsParserFactory(params: { tx: Tx }): TParamsParser
		call: (params: { tx: Tx; db: TDb; params: Parser.Infer<TParamsParser> }) => Promise<TReturns>
	}
	export namespace TxOperation {
		export type InferReturnType<TOperation extends TxOperation> = Awaited<ReturnType<TOperation["call"]>>
		export type InferParameters<TOperation extends TxOperation> = Parser.Infer<ReturnType<TOperation["paramsParserFactory"]>>
	}
	export type TxOperationFactory<TDb = unknown, TOperations extends TxOperationFactory.Operations<TDb> = TxOperationFactory.Operations<TDb>> = {
		generate<TTx extends Tx>(params: {
			tx: TTx
		}): ((params: { db: TDb }) => Promise<TxOperation.InferReturnType<TOperations[TTx["operation"]["name"]]>>) | null
	}
	export namespace TxOperationFactory {
		export type Operations<TDb = unknown> = Record<string, TxOperation<TDb>>
	}
}
