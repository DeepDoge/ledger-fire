import { randomBigInt } from "@/utils/random"
import type { Prisma } from "@prisma/client"
import type { Transaction } from "./transaction"

export type TransactionMethod = (tx: Transaction, prisma: Prisma.TransactionClient, ...args: any[]) => Promise<any>

export const methods = {
	async createWarehouse(_, prisma, name: string, address: string) {
		await prisma.warehouse.create({
			data: {
				id: randomBigInt(),
				name,
				address,
			},
		})
	},

	async createBrand(_, prisma, name: string) {
		await prisma.brand.create({
			data: {
				id: randomBigInt(),
				name,
			},
		})
	},

	async createProduct(_, prisma, name: string, brandId: number) {
		await prisma.product.create({
			data: {
				id: randomBigInt(),
				name,
				brandId,
			},
		})
	},

	async createProduct2(_, prisma, name: string, brandName: string) {
		await prisma.product.create({
			data: {
				id: randomBigInt(),
				name,
				brand: {
					create: {
						id: randomBigInt(),
						name: brandName,
					},
				},
			},
		})
	},

	async stockMovement(tx: Transaction, prisma, productId: number, warehouseId: number, quantity: number) {
		await prisma.stockMove.create({
			data: {
				id: randomBigInt(),
				txId: tx.id,
				productId,
				warehouseId,
				quantity,
			},
		})
	},
} as const satisfies Record<string, TransactionMethod>
