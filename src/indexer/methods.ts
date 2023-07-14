import { prisma } from "../prisma/client.js"
import type { Transaction } from "./transaction.js"

type Method = (tx: Transaction, ...args: any[]) => Promise<any>

export const methods: Record<string, Method> = {
	async createWarehouse(_, name: string, address: string) {
		await prisma.warehouse.create({
			data: {
				name,
				address,
			},
		})
	},

	async createBrand(_, name: string) {
		await prisma.brand.create({
			data: {
				name,
			},
		})
	},

	async createProduct(_, name: string, brandId: number) {
		await prisma.product.create({
			data: {
				name,
				brandId,
			},
		})
	},

	async createProduct2(_, name: string, brandName: string) {
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

	async stockMovement(tx: Transaction, productId: number, warehouseId: number, quantity: number) {
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
