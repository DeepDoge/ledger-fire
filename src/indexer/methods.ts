import { randomBigInt } from "@/utils/random"
import type { Prisma, Transaction } from "@prisma/client"
import type { Call, Tuples } from "hotscript"

export type TransactionMethod = (tx: Transaction, prisma: Prisma.TransactionClient, ...args: any[]) => Promise<any>
function method<T extends TransactionMethod>(fn: T) {
	return fn
}

export type MethodParameters<T extends TransactionMethod> = Call<Tuples.Drop<2>, Parameters<T>>

export namespace methods {
	export const createWarehouse = method(async (_, prisma, name: string, address: string) => {
		await prisma.warehouse.create({
			data: {
				id: randomBigInt(),
				name,
				address,
			},
		})
	})

	export const createBrand = method(async (_, prisma, name: string) => {
		await prisma.brand.create({
			data: {
				id: randomBigInt(),
				name,
			},
		})
	})

	export const createProduct = method(async (_, prisma, name: string, brandId: number) => {
		await prisma.product.create({
			data: {
				id: randomBigInt(),
				name,
				brandId,
			},
		})
	})

	export const createProduct2 = method(async (_, prisma, name: string, brandName: string) => {
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
	})

	export const stockMovement = method(async (tx, prisma, productId: number, warehouseId: number, quantity: number) => {
		await prisma.stockMove.create({
			data: {
				id: randomBigInt(),
				txId: tx.id,
				productId,
				warehouseId,
				quantity,
			},
		})
	})
}
