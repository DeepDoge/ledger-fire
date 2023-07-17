import type { Prisma } from "@prisma/client"
import type { Transaction } from "./transaction.js"

type Method = (tx: Transaction, prisma: Prisma.TransactionClient, ...args: any[]) => Promise<any>

export const methods: Record<string, Method> = {
	async createWarehouse(_, prisma, name: string, address: string) {
		await prisma.warehouse.create({
			data: {
				name,
				address,
			},
		})
	},

	async createBrand(_, prisma, name: string) {
		await prisma.brand.create({
			data: {
				name,
			},
		})
	},

	async createProduct(_, prisma, name: string, brandId: number) {
		await prisma.product.create({
			data: {
				name,
				brandId,
			},
		})
	},

	async createProduct2(_, prisma, name: string, brandName: string) {
		await prisma.product.create({
			data: {
				name,
				brand: {
					create: {
						name: brandName,
					},
				},
			},
		})
	},

	async stockMovement(tx: Transaction, prisma, productId: number, warehouseId: number, quantity: number) {
		await prisma.stockMove.create({
			data: {
				txId: tx.id,
				productId,
				warehouseId,
				quantity,
			},
		})
	},
}
