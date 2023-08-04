import type { Prisma, Transaction } from "@prisma/client"
import { z } from "zod"

export type Method = {
	call: (tx: Transaction, prisma: Prisma.TransactionClient, params: any) => unknown
	zod: z.ZodObject<Record<PropertyKey, z.ZodType>>
}

function method<TParams extends Method["zod"], TReturns>(
	zod: TParams,
	fn: (tx: Transaction, prisma: Prisma.TransactionClient, params: z.infer<TParams>) => TReturns
) {
	return {
		call: fn,
		zod,
	} satisfies Method
}

export namespace methods {
	export const createWarehouse = method(
		z.object({
			name: z.string(),
			address: z.string(),
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
		z.object({
			name: z.string(),
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
		z.object({
			name: z.string(),
			brandId: z.number(),
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
		z.object({
			name: z.string(),
			brandName: z.string(),
		}),
		async (_, prisma, { name, brandName }) => {
			return await prisma.product.create({
				data: {
					name,
					brand: {
						create: {
							name: brandName,
						},
					},
				},
			})
		}
	)

	export const createAccount = method(
		z.object({
			fullName: z.union([z.string(), z.object({ name: z.string(), surname: z.string() })]),
			tckn: z.string().optional(),
			phone: z.string().optional(),
			email: z.string().optional(),
			address: z.string().optional(),
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

	export const enterSupplierBill = method(
		z.object({
			id: z.string(),
			supplierId: z.number(),
			items: z.array(
				z.object({
					name: z.string(),
					code: z.string(),
					quantity: z.bigint(),
					price: z.bigint(),
				})
			),
			timestamp: z.bigint(),
		}),
		async (tx, prisma, { id, supplierId, items, timestamp }) => {
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
		}
	)

	export const matchSupplierProduct = method(
		z.object({
			supplierId: z.number(),
			supplierProductCode: z.string(),
			localProductId: z.number(),
		}),
		async (_, prisma, { supplierId, supplierProductCode, localProductId }) => {
			await prisma.supplierProduct.update({
				where: { supplierId_code: { supplierId, code: supplierProductCode } },
				data: { matchedProductId: localProductId },
			})
		}
	)

	export const verifySupplierBill = method(
		z.object({
			id: z.string(),
			warehouseId: z.number(),
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
