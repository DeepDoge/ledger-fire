import type { Prisma } from "@prisma/client"
import { z } from "zod"

export namespace Database {
	export type QueryRequest = z.infer<typeof QueryRequest.Parser>
	export namespace QueryRequest {
		export const Parser = z.object({
			table: z.string().pipe(
				z.custom((value) => {
					if (typeof value !== "string") throw new Error("Invalid table name")
					if (value[0] === "$") throw new Error("Invalid table name")
					return value
				}),
			),
			path: z.string().array(),
			args: z.unknown().array(),
		})
	}

	export type TxRequest = Parser.Infer<typeof TxRequest.Parser>
	export namespace TxRequest {
		export const Parser = z.object({
			mutation: z.object({
				name: z.string(),
				params: z.unknown(),
			}),
			from: z.instanceof(Uint8Array),
			language: z.string(),
		}) satisfies Parser
	}
	export type Tx = Parser.Infer<typeof Tx.Parser>
	export namespace Tx {
		export const Parser = z.intersection(
			TxRequest.Parser,
			z.object({
				id: z.bigint(),
				timestamp: z.number(),
			}),
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

	export type TxMutation<TParamsParser extends Parser = Parser, TReturns = unknown> = {
		paramsParser(params: { tx: Tx }): TParamsParser
		call: (params: { tx: Tx; db: Prisma.TransactionClient; params: Parser.Infer<TParamsParser> }) => Promise<TReturns>
	}
	export namespace TxMutation {
		export type InferReturnType<TMutation extends TxMutation> = Awaited<ReturnType<TMutation["call"]>>
		export type InferParameters<TMutation extends TxMutation> = Parser.Infer<ReturnType<TMutation["paramsParser"]>>

		export function create() {
			return {
				paramsParser: <TParamsParser extends Parser>(paramsParser: TxMutation<TParamsParser>["paramsParser"]) => {
					return {
						call: <TReturns>(call: TxMutation<TParamsParser, TReturns>["call"]): TxMutation<TParamsParser, TReturns> => {
							return {
								paramsParser,
								call,
							}
						},
					}
				},
			}
		}
	}
	export type TxMutationFactory<TMutations extends TxMutationFactory.Mutations = TxMutationFactory.Mutations> = {
		generate<TTx extends Tx>(params: {
			tx: TTx
		}): ((params: { db: Prisma.TransactionClient }) => Promise<TxMutation.InferReturnType<TMutations[TTx["mutation"]["name"]]>>) | null
	}
	export namespace TxMutationFactory {
		export type Mutations = Record<string, TxMutation<Database.Parser, any>>

		export function create<TMutations extends Mutations>({ mutations }: { mutations: TMutations }): TxMutationFactory<TMutations> {
			return {
				generate({ tx }) {
					const mutation = mutations[tx.mutation.name]
					if (!mutation) return null
					return async ({ db }) => await mutation.call({ tx, db, params: mutation.paramsParser({ tx }).parse(tx.mutation.params) })
				},
			}
		}
	}
}
