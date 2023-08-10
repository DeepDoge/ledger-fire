import type { Prisma, Transaction } from "@prisma/client"
import { z } from "zod"
import type { Database } from "."

export function createMutator<TParams extends Database.Mutator["scheme"], TReturns>(
	scheme: TParams,
	fn: (tx: Transaction, db: Prisma.TransactionClient, params: z.infer<TParams>) => TReturns
) {
	return {
		call: fn,
		scheme,
	} satisfies Database.Mutator
}

function toLowerCase(value: string) {
	return value
		.toLowerCase()
		.normalize()
		.replace(/[\u0300-\u036f]/g, "")
}

export namespace mutators {
	export const createWarehouse = createMutator(
		z.object({
			name: z.string().transform(toLowerCase),
			address: z.string().transform(toLowerCase),
		}),
		async (_, db, { name, address }) => {
			return await db.warehouse.create({
				data: {
					name,
					address,
				},
			})
		}
	)

	export const deleteWarehouse = createMutator(
		z.object({
			id: z.number(),
		}),
		async (_, db, { id }) => {
			return await db.warehouse.delete({
				where: {
					id,
				},
			})
		}
	)

	export const createBrand = createMutator(
		z.object({
			name: z.string(),
		}),
		async (_, db, { name }) => {
			return await db.brand.create({
				data: {
					name,
				},
			})
		}
	)

	export const createProduct = createMutator(
		z.object({
			name: z.string(),
			brandId: z.number(),
		}),
		async (_, db, { name, brandId }) => {
			return await db.product.create({
				data: {
					name,
					brandId,
				},
			})
		}
	)

	export const createProduct2 = createMutator(
		z.object({
			name: z.string(),
			brandName: z.string(),
		}),
		async (_, db, { name, brandName }) => {
			return await db.product.create({
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

	export const createCustomerAccount = createMutator(
		z.object({
			name: z.string(),
			surname: z.string(),
			tckn: z.string().optional(),
			phone: z.string().optional(),
			email: z.string().email().optional(),
			address: z.string().optional(),
		}),
		async (_, db, { name, surname, tckn, phone, email, address }) => {
			return await db.account.create({
				data: {
					fullName: `${name} ${surname}`,
					tckn,
					phone,
					email,
					address,
				},
			})
		}
	)

	export const createSupplierAccount = createMutator(
		z.object({
			name: z.string(),
			taxNumber: z.string(),
			phone: z.string(),
			email: z.string().email(),
			address: z.string(),
		}),
		async (_, db, params) => {
			return await db.account.create({
				data: {
					fullName: params.name,
					tckn: params.taxNumber,
					address: params.address,
					email: params.email,
					phone: params.phone,
					Supplier: { create: {} },
				},
			})
		}
	)

	export const enterSupplierBill = createMutator(
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
		async (tx, db, { id, supplierId, items, timestamp }) => {
			await db.supplierBill.create({
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

	export const matchSupplierProduct = createMutator(
		z.object({
			supplierId: z.number(),
			supplierProductCode: z.string(),
			localProductId: z.number(),
		}),
		async (_, db, { supplierId, supplierProductCode, localProductId }) => {
			await db.supplierProduct.update({
				where: { supplierId_code: { supplierId, code: supplierProductCode } },
				data: { matchedProductId: localProductId },
			})
		}
	)

	export const verifySupplierBill = createMutator(
		z.object({
			id: z.string(),
			warehouseId: z.number(),
		}),
		async (_, db, { id, warehouseId }) => {
			const bill = await db.supplierBill.update({
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

			await db.warehouse.update({
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
