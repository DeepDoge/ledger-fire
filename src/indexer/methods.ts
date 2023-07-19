import { randomBigInt } from "@/utils/random"
import type { Prisma, Transaction } from "@prisma/client"
import type { Type, TypeObject } from "type-spirit/library"
import { $bigint, $object, $string, type $infer } from "type-spirit/library"

export type Method = {
	call: (tx: Transaction, prisma: Prisma.TransactionClient, params: any) => unknown
	$params: TypeObject<Record<PropertyKey, Type<unknown>>>
}

function method<TParams extends Record<PropertyKey, Type<any>>, TReturns>(
	$params: TParams,
	fn: (tx: Transaction, prisma: Prisma.TransactionClient, params: $infer<TypeObject<TParams>>) => TReturns
) {
	return {
		call: fn,
		$params: $object($params),
	} satisfies Method
}

export namespace methods {
	export const createWarehouse = method({ name: $string(), address: $string() }, async (_, prisma, { name, address }) => {
		await prisma.warehouse.create({
			data: {
				id: randomBigInt(),
				name,
				address,
			},
		})
	})

	export const createBrand = method({ name: $string() }, async (_, prisma, { name }) => {
		await prisma.brand.create({
			data: {
				id: randomBigInt(),
				name,
			},
		})
	})

	export const createProduct = method({ name: $string(), brandId: $bigint() }, async (_, prisma, { name, brandId }) => {
		await prisma.product.create({
			data: {
				id: randomBigInt(),
				name,
				brandId,
			},
		})
	})

	export const createProduct2 = method({ name: $string(), brandName: $string() }, async (_, prisma, { name, brandName }) => {
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

	export const stockMovement = method(
		{ productId: $bigint(), warehouseId: $bigint(), quantity: $bigint() },
		async (tx, prisma, { productId, warehouseId, quantity }) => {
			await prisma.stockMove.create({
				data: {
					id: randomBigInt(),
					txId: tx.id,
					productId,
					warehouseId,
					quantity,
				},
			})
		}
	)
}
