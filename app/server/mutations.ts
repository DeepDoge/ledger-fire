import { toLocaleLowerCase } from "@app/common/utils/casing"
import { z } from "zod"
import { Database } from "./database"
import { PrismaTxMutationFactory } from "./implementation/prismaTxMutationFactory"

namespace Mutations {
	export const createWarehouse = PrismaTxMutationFactory.createMutation()
		.paramsParser(({ tx: { language } }) =>
			z.object({
				name: z.string().transform(toLocaleLowerCase(language)),
				address: z.string().transform(toLocaleLowerCase(language)),
			})
		)
		.call(async ({ db, params }) => {
			return await db.warehouse.create({
				data: {
					name: params.name,
					address: params.address,
				},
			})
		})

	export const deleteWarehouse = PrismaTxMutationFactory.createMutation()
		.paramsParser(() =>
			z.object({
				id: z.number(),
			})
		)
		.call(async ({ db, params }) => {
			return await db.warehouse.delete({
				where: {
					id: params.id,
				},
			})
		})

	export const createBrand = PrismaTxMutationFactory.createMutation()
		.paramsParser(({ tx: { language } }) =>
			z.object({
				name: z.string().transform(toLocaleLowerCase(language)),
			})
		)
		.call(async ({ db, params }) => {
			return await db.brand.create({
				data: {
					name: params.name,
				},
			})
		})

	export const createProduct = PrismaTxMutationFactory.createMutation()
		.paramsParser(({ tx: { language } }) =>
			z.object({
				name: z.string().transform(toLocaleLowerCase(language)),
				brandId: z.number(),
			})
		)
		.call(async ({ db, params }) => {
			return await db.product.create({
				data: {
					name: params.name,
					brandId: params.brandId,
				},
			})
		})

	export const createProduct2 = PrismaTxMutationFactory.createMutation()
		.paramsParser(({ tx: { language } }) =>
			z.object({
				name: z.string().transform(toLocaleLowerCase(language)),
				brandName: z.string().transform(toLocaleLowerCase(language)),
			})
		)
		.call(async ({ db, params }) => {
			return await db.product.create({
				data: {
					name: params.name,
					brand: {
						connectOrCreate: {
							where: { name: params.brandName },
							create: { name: params.brandName },
						},
					},
				},
			})
		})

	export const deleteProduct = PrismaTxMutationFactory.createMutation()

		.paramsParser(() =>
			z.object({
				id: z.number(),
			})
		)
		.call(async ({ db, params }) => {
			return await db.product.delete({
				where: {
					id: params.id,
				},
			})
		})

	export const createCustomerAccount = PrismaTxMutationFactory.createMutation()
		.paramsParser(({ tx: { language } }) =>
			z.object({
				name: z.string().transform(toLocaleLowerCase(language)),
				surname: z.string().transform(toLocaleLowerCase(language)),
				tckn: z
					.string()
					.regex(/^\d{11}$/)
					.optional(),
				phone: z.string().optional(),
				email: z.string().email().transform(toLocaleLowerCase(language)).optional(),
				address: z.string().transform(toLocaleLowerCase(language)).optional(),
			})
		)
		.call(async ({ db, params }) => {
			return await db.account.create({
				data: {
					fullName: `${params.name} ${params.surname}`,
					tckn: params.tckn ?? null,
					phone: params.phone ?? null,
					email: params.email ?? null,
					address: params.address ?? null,
				},
			})
		})

	export const createSupplierAccount = PrismaTxMutationFactory.createMutation()
		.paramsParser(({ tx: { language } }) =>
			z.object({
				name: z.string().transform(toLocaleLowerCase(language)),
				taxNumber: z.string(),
				phone: z.string().optional(),
				email: z.string().email().transform(toLocaleLowerCase(language)).optional(),
				address: z.string().transform(toLocaleLowerCase(language)).optional(),
			})
		)
		.call(async ({ db, params }) => {
			return await db.account.create({
				data: {
					fullName: params.name ?? null,
					tckn: params.taxNumber ?? null,
					address: params.address ?? null,
					email: params.email ?? null,
					phone: params.phone ?? null,
					Supplier: { create: {} },
				},
			})
		})

	export const enterSupplierBill = PrismaTxMutationFactory.createMutation()
		.paramsParser(({ tx: { language } }) =>
			z.object({
				id: z.string(),
				supplierId: z.number(),
				items: z.array(
					z.object({
						name: z.string().transform(toLocaleLowerCase(language)),
						code: z.string(),
						quantity: z.bigint(),
						price: z.bigint(),
					})
				),
				timestamp: z.bigint(),
			})
		)
		.call(async ({ tx, db, params: { id, items, supplierId, timestamp } }) => {
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
		})

	export const matchSupplierProduct = PrismaTxMutationFactory.createMutation()
		.paramsParser(() =>
			z.object({
				supplierId: z.number(),
				supplierProductCode: z.string(),
				localProductId: z.number(),
			})
		)
		.call(async ({ db, params: { supplierId, supplierProductCode, localProductId } }) => {
			await db.supplierProduct.update({
				where: { supplierId_code: { supplierId, code: supplierProductCode } },
				data: { matchedProductId: localProductId },
			})
		})

	export const verifySupplierBill = PrismaTxMutationFactory.createMutation()
		.paramsParser(() =>
			z.object({
				id: z.string(),
				warehouseId: z.number(),
			})
		)
		.call(async ({ db, params: { id, warehouseId } }) => {
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
		})
}
export const mutations = Mutations satisfies Database.TxMutationFactory.Mutations
