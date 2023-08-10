import { db } from "@/db/api"

export type SearchManager<TQueryName extends SearchManager.QueryName = SearchManager.QueryName> = {
	search(text: string): Promise<SearchManager.Item<TQueryName>[]>
}
export namespace SearchManager {
	export type QueryName = keyof typeof db.query
	export type Item<TQueryName extends QueryName> = Awaited<ReturnType<(typeof db.query)[TQueryName]["findUniqueOrThrow"]>>
	export type Where<TQueryName extends QueryName> = NonNullable<Parameters<(typeof db.query)[TQueryName]["findMany"]>[0]>["where"]
	// @ts-ignore
	export type Include<TQueryName extends QueryName> = NonNullable<Parameters<(typeof db.query)[TQueryName]["findMany"]>[0]>["include"]

	export function create<TQueryName extends QueryName, TItemIdKey extends keyof Item<TQueryName>>(
		queryName: TQueryName,
		params: {
			itemIdKey: TItemIdKey
			include: Include<TQueryName>
			queries: (text: string) => Where<TQueryName>[]
			take: number
		}
	): SearchManager<TQueryName> {
		return {
			async search(text) {
				const ignoreIds: unknown[] = []
				const results: Item<TQueryName>[] = []

				for (const where of params.queries(text)) {
					const result: Item<TQueryName>[] = await (db.query[queryName] as any).findMany({
						where: { AND: [{ [params.itemIdKey]: { notIn: ignoreIds } }, where] },
						include: params.include,
						take: params.take,
					})

					for (const item of result) {
						results.push(item)
						ignoreIds.push(item[params.itemIdKey])
					}

					params.take -= result.length
				}

				return results
			},
		}
	}
}
