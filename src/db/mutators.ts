import { toLocaleLowerCase } from "@/utils/casing"
import { z } from "zod"
import type { Database } from "."

export function createMutator<const TScheme extends Database.Mutator["scheme"]>({ scheme }: { scheme: TScheme }) {
	return <const TCall extends Database.Mutator.Call<TScheme>>({ call }: { call: TCall }): Database.Mutator<TScheme, TCall> => ({
		scheme,
		call,
	})
}

export namespace mutators {
	export const createWarehouse = createMutator({
		scheme(lang) {
			return z.object({
				name: z.string().transform(toLocaleLowerCase(lang)),
				address: z.string().transform(toLocaleLowerCase(lang)),
			})
		},
	})({
		async call(_, db, { name, address }) {
			return await db.warehouse.create({
				data: {
					name,
					address,
				},
			})
		},
	})

	export const deleteWarehouse = createMutator({
		scheme() {
			return z.object({
				id: z.number(),
			})
		},
	})({
		async call(_, db, { id }) {
			return await db.warehouse.delete({
				where: {
					id,
				},
			})
		},
	})

	export const createBrand = createMutator({
		scheme(lang) {
			return z.object({
				name: z.string().transform(toLocaleLowerCase(lang)),
			})
		},
	})({
		async call(_, db, { name }) {
			return await db.brand.create({
				data: {
					name,
				},
			})
		},
	})

	export const createProduct = createMutator({
		scheme(lang) {
			return z.object({
				name: z.string().transform(toLocaleLowerCase(lang)),
				brandId: z.number(),
			})
		},
	})({
		async call(_, db, { name, brandId }) {
			return await db.product.create({
				data: {
					name,
					brandId,
				},
			})
		},
	})

	export const createProduct2 = createMutator({
		scheme(lang) {
			return z.object({
				name: z.string().transform(toLocaleLowerCase(lang)),
				brandName: z.string().transform(toLocaleLowerCase(lang)),
			})
		},
	})({
		async call(_, db, { name, brandName }) {
			return await db.product.create({
				data: {
					name,
					brand: {
						connectOrCreate: {
							where: { name: brandName },
							create: { name: brandName },
						},
					},
				},
			})
		},
	})

	export const deleteProduct = createMutator({
		scheme() {
			return z.object({
				id: z.number(),
			})
		},
	})({
		async call(_, db, { id }) {
			return await db.product.delete({
				where: {
					id,
				},
			})
		},
	})

	export const createCustomerAccount = createMutator({
		scheme(lang) {
			return z.object({
				name: z.string().transform(toLocaleLowerCase(lang)),
				surname: z.string().transform(toLocaleLowerCase(lang)),
				tckn: z
					.string()
					.regex(/^\d{11}$/)
					.optional(),
				phone: z.string().optional(),
				email: z.string().email().transform(toLocaleLowerCase(lang)).optional(),
				address: z.string().transform(toLocaleLowerCase(lang)).optional(),
			})
		},
	})({
		async call(_, db, { name, surname, tckn, phone, email, address }) {
			return await db.account.create({
				data: {
					fullName: `${name} ${surname}`,
					tckn,
					phone,
					email,
					address,
				},
			})
		},
	})

	export const createSupplierAccount = createMutator({
		scheme(lang) {
			return z.object({
				name: z.string().transform(toLocaleLowerCase(lang)),
				taxNumber: z.string(),
				phone: z.string().optional(),
				email: z.string().email().transform(toLocaleLowerCase(lang)).optional(),
				address: z.string().transform(toLocaleLowerCase(lang)).optional(),
			})
		},
	})({
		async call(_, db, params) {
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
		},
	})

	export const enterSupplierBill = createMutator({
		scheme(lang) {
			return z.object({
				id: z.string(),
				supplierId: z.number(),
				items: z.array(
					z.object({
						name: z.string().transform(toLocaleLowerCase(lang)),
						code: z.string(),
						quantity: z.bigint(),
						price: z.bigint(),
					})
				),
				timestamp: z.bigint(),
			})
		},
	})({
		async call(tx, db, { id, supplierId, items, timestamp }) {
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
		},
	})

	export const matchSupplierProduct = createMutator({
		scheme() {
			return z.object({
				supplierId: z.number(),
				supplierProductCode: z.string(),
				localProductId: z.number(),
			})
		},
	})({
		async call(_, db, { supplierId, supplierProductCode, localProductId }) {
			await db.supplierProduct.update({
				where: { supplierId_code: { supplierId, code: supplierProductCode } },
				data: { matchedProductId: localProductId },
			})
		},
	})

	export const verifySupplierBill = createMutator({
		scheme() {
			return z.object({
				id: z.string(),
				warehouseId: z.number(),
			})
		},
	})({
		async call(_, db, { id, warehouseId }) {
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
		},
	})
}
