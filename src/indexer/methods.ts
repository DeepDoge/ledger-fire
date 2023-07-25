import { randomBigInt } from "@/utils/random"
import type { Prisma, Transaction } from "@prisma/client"
import type { Type, TypeObject } from "type-spirit/library"
import { $array, $bigint, $null, $object, $string, $union, type $infer } from "type-spirit/library"

export type Method = {
	call: (tx: Transaction, prisma: Prisma.TransactionClient, params: any) => unknown
	$params: TypeObject<Record<PropertyKey, Type<unknown>>>
}

function method<TParams extends TypeObject<Record<PropertyKey, Type<any>>>, TReturns>(
	$params: TParams,
	fn: (tx: Transaction, prisma: Prisma.TransactionClient, params: $infer<TParams>) => TReturns
) {
	return {
		call: fn,
		$params,
	} satisfies Method
}

export namespace methods {
	export const createWarehouse = method(
		$object({
			name: $string(),
			address: $string(),
		}),
		async (_, prisma, { name, address }) => {
			return await prisma.warehouse.create({
				data: {
					name,
					address,
				},
			})
		}
	)

	export const createBrand = method(
		$object({
			name: $string(),
		}),
		async (_, prisma, { name }) => {
			return await prisma.brand.create({
				data: {
					name,
				},
			})
		}
	)

	export const createProduct = method(
		$object({
			name: $string(),
			brandId: $bigint(),
		}),
		async (_, prisma, { name, brandId }) => {
			return await prisma.product.create({
				data: {
					name,
					brandId,
				},
			})
		}
	)

	export const createProduct2 = method(
		$object({
			name: $string(),
			brandName: $string(),
		}),
		async (_, prisma, { name, brandName }) => {
			return await prisma.product.create({
				data: {
					name,
					brand: {
						create: {
							id: randomBigInt(),
							name: brandName,
						},
					},
				},
			})
		}
	)

	export const createAccount = method(
		$object({
			fullName: $union($string(), $object({ name: $string(), surname: $string() })),
			tckn: $union($string(), $null()),
			phone: $union($string(), $null()),
			email: $union($string(), $null()),
			address: $union($string(), $null()),
		}),
		async (_, prisma, { fullName, tckn, phone, email, address }) => {
			return await prisma.account.create({
				data: {
					fullName: typeof fullName === "string" ? fullName : `${fullName.name} ${fullName.surname}`,
					tckn,
					phone,
					email,
					address,
				},
			})
		}
	)

	export type SupplierBillCreate = $infer<typeof $supplierBillCreate>
	export const $supplierBillCreate = $object({
		id: $string(),
		supplierId: $bigint(),
		items: $array(
			$object({
				name: $string(),
				code: $string(),
				quantity: $bigint(),
				price: $bigint(),
			})
		),
		timestamp: $bigint(),
	})

	export const enterSupplierBill = method($supplierBillCreate, async (tx, prisma, { id, supplierId, items, timestamp }) => {
		await prisma.supplierBill.create({
			data: {
				id,
				txId: tx.id,
				timestamp,
				supplierId,
				SupplierBillItem: {
					create: items.map(({ name, code, price, quantity }) => ({
						price,
						quantity,
						supplierProduct: {
							connectOrCreate: {
								where: { supplierId_code: { supplierId, code } },
								create: {
									supplierId,
									code,
									name,
								},
							},
						},
					})),
				},
			},
		})
	})

	export const matchSupplierProduct = method(
		$object({
			supplierId: $bigint(),
			supplierProductCode: $string(),
			localProductId: $bigint(),
		}),
		async (_, prisma, { supplierId, supplierProductCode, localProductId }) => {
			await prisma.supplierProduct.update({
				where: { supplierId_code: { supplierId, code: supplierProductCode } },
				data: { matchedProductId: localProductId },
			})
		}
	)

	export const verifySupplierBill = method(
		$object({
			id: $string(),
			warehouseId: $bigint(),
		}),
		async (_, prisma, { id, warehouseId }) => {
			const bill = await prisma.supplierBill.update({
				include: {
					SupplierBillItem: {
						include: {
							supplierProduct: {
								include: {
									matchedProduct: true,
								},
							},
						},
					},
				},
				where: {
					id,
					SupplierBillItem: { every: { supplierProduct: { matchedProduct: { isNot: null } } } },
				},
				data: { verified: true },
			})

			if (!bill) throw new Error("Bill not found or cannot be verified")

			await prisma.warehouse.update({
				where: { id: warehouseId },
				data: {
					stocks: {
						upsert: bill.SupplierBillItem.map(({ supplierProduct, quantity }) => ({
							where: { warehouseId_productId: { warehouseId, productId: supplierProduct.matchedProduct!.id } },
							update: { quantity: { increment: quantity } },
							create: { warehouseId, productId: supplierProduct.matchedProduct!.id, quantity },
						})),
					},
				},
			})
		}
	)
}
