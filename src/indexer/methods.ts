import type { Prisma } from "@prisma/client"
import type { Transaction } from "./transaction"

export type TransactionMethod = (tx: Transaction, prisma: Prisma.TransactionClient, ...args: any[]) => Promise<any>

export const methods = {
	async createWarehouse(tx, prisma, name: string, address: string) {
		await prisma.warehouse.create({
			data: {
				id: tx.id,
				name,
				address,
			},
		})
	},

	async createBrand(tx, prisma, name: string) {
		await prisma.brand.create({
			data: {
				id: tx.id,
				name,
			},
		})
	},

	async createProduct(tx, prisma, name: string, brandId: number) {
		await prisma.product.create({
			data: {
				id: tx.id,
				name,
				brandId,
			},
		})
	},

	async createProduct2(tx, prisma, name: string, brandName: string) {
		await prisma.product.create({
			data: {
				id: tx.id,
				name,
				brand: {
					create: {
						id: tx.id,
						name: brandName,
					},
				},
			},
		})
	},

	async stockMovement(tx: Transaction, prisma, productId: number, warehouseId: number, quantity: number) {
		await prisma.stockMove.create({
			data: {
				id: tx.id,
				txId: tx.id,
				productId,
				warehouseId,
				quantity,
			},
		})
	},
} as const satisfies Record<string, TransactionMethod>
