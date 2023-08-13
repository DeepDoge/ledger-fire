import type { Prisma } from "@prisma/client"
import type { Database } from "../database"

export type PrismaTxOperationFactory<TOperations extends PrismaTxOperationFactory.Operations> = Database.TxOperationFactory<
	Prisma.TransactionClient,
	TOperations
> & {}
export namespace PrismaTxOperationFactory {
	export type Operations = Record<string, Database.TxOperation<Prisma.TransactionClient, Database.Parser, any>>

	export function createOperation() {
		return {
			paramsParserFactory: <TParamsParser extends Database.Parser>(
				paramsParserFactory: Database.TxOperation<Prisma.TransactionClient, TParamsParser>["paramsParserFactory"]
			) => {
				return {
					call: <TReturns>(
						call: Database.TxOperation<Prisma.TransactionClient, TParamsParser, TReturns>["call"]
					): Database.TxOperation<Prisma.TransactionClient, TParamsParser, TReturns> => {
						return {
							paramsParserFactory,
							call,
						}
					},
				}
			},
		}
	}
	export function create<TOperations extends Operations>({ operations }: { operations: TOperations }): PrismaTxOperationFactory<TOperations> {
		return {
			generate({ tx }) {
				const operation = operations[tx.operation.name]
				if (!operation) return null
				return async ({ db }) => await operation.call({ tx, db, params: operation.paramsParserFactory({ tx }).parse(tx.operation.params) })
			},
		}
	}
}
