import { prismaProxy } from "@/prisma/proxyClient"
import type { Prisma } from "@prisma/client"

export type Product = Prisma.ProductGetPayload<{ include: { brand: true } }>

export async function searchProduct(value: string, take = 128) {
	const ignoreIds: Product["id"][] = []
	const results: Product[] = []

	const include = { brand: true } as const satisfies Prisma.ProductInclude
	const where = { id: { notIn: ignoreIds } } as const satisfies Prisma.ProductWhereInput

	function addResult(result: Product[]) {
		for (const product of result) {
			results.push(product)
			ignoreIds.push(product.id)
		}
		take -= result.length
	}

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ code: { equals: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ barcode: { equals: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ name: { equals: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ brand: { name: { equals: value } } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ code: { startsWith: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ barcode: { startsWith: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ name: { startsWith: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ brand: { name: { startsWith: value } } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ code: { contains: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ barcode: { contains: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ name: { contains: value } }, where] },
			include,
			take,
		})
	)

	addResult(
		await prismaProxy.product.findMany({
			where: { AND: [{ brand: { name: { contains: value } } }, where] },
			include,
			take,
		})
	)

	return results
}
