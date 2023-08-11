import { App } from "@/app"
import type { db } from "@/db/api"
import type { Prisma } from "@prisma/client"

export type SearchManager<TQuery extends SearchManager.Query, TInclude extends SearchManager.Include<TQuery>> = {
	search(text: string, take: number): Promise<SearchManager.Item<TQuery, TInclude>[]>
}

export namespace SearchManager {
	export type Query = (typeof db.query)[keyof typeof db.query]
	export type Where<TQuery extends Query> = NonNullable<Parameters<TQuery["findMany"]>[0]>["where"]
	export type Include<TQuery extends Query> = ({ include: {} } & NonNullable<Parameters<TQuery["findMany"]>[0]>)["include"]

	// Hacks to get correct type from prisma, because prisma cant just generete good types
	// @ts-ignore
	function ItemTypeHelper<TQuery extends Query["findMany"], TArgs extends Prisma.Args>() {
		const findMany = null as unknown as TQuery
		return null as unknown as Awaited<ReturnType<typeof findMany<TArgs>>>[number]
	}
	export type Item<TQuery extends Query, TInclude extends Include<TQuery>> = Awaited<ReturnType<TQuery["findMany"]>>[number] &
		ReturnType<typeof ItemTypeHelper<TQuery["findMany"], { include: TInclude }>>

	export function create<TQuery extends Query, const TInclude extends Include<TQuery>, const TItemIdKey extends keyof Item<TQuery, TInclude>>(
		query: TQuery,
		params: {
			itemIdKey: TItemIdKey
			include?: TInclude
			queries: (text: string) => Where<TQuery>[]
		}
	) {
		return {
			async search(text, take: number = 256) {
				const ignoreIds: unknown[] = []

				// @ts-ignore
				const results: Item<TQuery, TInclude>[] = []

				const queriesU = params.queries(text.toLocaleUpperCase(App.lang.ref))
				const queriesL = params.queries(text.toLocaleLowerCase(App.lang.ref))
				const queries: Where<TQuery>[] = []
				for (let i = 0; i < queriesL.length; i++) queries.push({ OR: [queriesU[i], queriesL[i]] } as Where<TQuery>)
				// TODO: Solution above is good enough for now, but need a more elegant solution.
				// Tbh we can index many things on db as lowercase or uppercase then on front end we can add the casing, upper, lower, capitilized etc...
				// This way we dont have to relay on person doing the mutation for casing.
				// Mutator can have the locale of the client, so it can do the lowercasing based on that

				for (const where of queries) {
					const result: typeof results = await (query as any).findMany({
						where: { AND: [{ [params.itemIdKey]: { notIn: ignoreIds } }, where] },
						include: params.include,
						take,
					})

					for (const item of result) {
						results.push(item)
						ignoreIds.push(item[params.itemIdKey])
					}

					take -= result.length
				}

				return results
			},
		} as const satisfies SearchManager<TQuery, TInclude>
	}
}
