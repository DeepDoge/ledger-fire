import type { Database } from "../database"

export type PrismaTxMutationFactory<TMutations extends PrismaTxMutationFactory.Mutations> = Database.TxMutationFactory<TMutations> & {}
export namespace PrismaTxMutationFactory {
	export type Mutations = Record<string, Database.TxMutation<Database.Parser, any>>

	export function createMutation() {
		return {
			paramsParser: <TParamsParser extends Database.Parser>(paramsParserFactory: Database.TxMutation<TParamsParser>["paramsParser"]) => {
				return {
					call: <TReturns>(call: Database.TxMutation<TParamsParser, TReturns>["call"]): Database.TxMutation<TParamsParser, TReturns> => {
						return {
							paramsParser: paramsParserFactory,
							call,
						}
					},
				}
			},
		}
	}
	export function create<TMutations extends Mutations>({ mutations }: { mutations: TMutations }): PrismaTxMutationFactory<TMutations> {
		return {
			generate({ tx }) {
				const mutation = mutations[tx.mutation.name]
				if (!mutation) return null
				return async ({ db }) => await mutation.call({ tx, db, params: mutation.paramsParser({ tx }).parse(tx.mutation.params) })
			},
		}
	}
}
