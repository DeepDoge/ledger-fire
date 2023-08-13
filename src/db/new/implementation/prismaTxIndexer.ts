import { Bytes } from "@/utils/bytes"
import type { Prisma, PrismaClient } from "@prisma/client"
import type { Database } from "../database"

export type PrismaTxIndexer = Database.TxIndexer & {}
export namespace PrismaTxIndexer {
	export function create<TOperationFactory extends Database.TxOperationFactory<Prisma.TransactionClient>, TStore extends Database.TxStore>({
		txStore,
		operationFactory,
		prisma,
	}: {
		txStore: TStore
		operationFactory: TOperationFactory
		prisma: PrismaClient
	}): PrismaTxIndexer {
		return {
			async start() {
				while (true) {
					await prisma.$transaction(async (prisma) => {
						const txId = await prisma.transaction
							.findFirstOrThrow({ select: { id: true }, orderBy: { id: "desc" } })
							.then((tx) => tx.id + 1n)
							.catch(() => 0n)
						const tx = await txStore.get({ id: txId })
						if (!tx) {
							console.log(`Waiting for new tx ${txId.toString()}`)
							await new Promise((resolve) => setTimeout(resolve, 1000))
							return
						}

						console.log(`Indexing tx ${tx.id.toString()}`)

						const operation = operationFactory.generate({ tx })
						if (!operation) throw new Error(`Mutator ${tx.operation.name} not found`)
						const result = await operation({ db: prisma })

						await prisma.transaction.create({
							data: {
								id: tx.id,
								from: Buffer.from(tx.from),
								timestamp: tx.timestamp,
								result: Buffer.from(Bytes.encode(result)),
							},
						})

						console.log(`Indexed tx ${tx.id.toString()}`)
					})
				}
			},
		}
	}
}
