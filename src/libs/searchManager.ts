import { query } from "@/api/client"
import { App } from "@/app"
import type { Prisma } from "@prisma/client"

export type SearchManager<
	TQuery extends SearchManager.Query = SearchManager.Query,
	TInclude extends SearchManager.Include<TQuery> = SearchManager.Include<TQuery>
> = {
	search(text: string, take?: number): Promise<SearchManager.Item<TQuery, TInclude>[]>
}

export namespace SearchManager {
	export type Query = (typeof query)[keyof typeof query]
	export type Where<TQuery extends Query> = NonNullable<Parameters<TQuery["findMany"]>[0]>["where"]
	export type Include<TQuery extends Query> = ({ include: {} } & NonNullable<Parameters<TQuery["findMany"]>[0]>)["include"]

	// Hacks to get correct type from prisma, because prisma cant just generete good types
	// Because Prisma doesnt have something nice like this Prisma.GetResult<TModelName, TInclude, TSelect>
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
	): SearchManager<TQuery, TInclude> {
		return {
			async search(text, take: number = 256) {
				const ignoreIds: unknown[] = []
				const results: Item<TQuery, TInclude>[] = []
				const queries = params.queries(text.toLocaleLowerCase(App.language.ref))

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
		}
	}
}
