import { App } from "@/app"
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
		}
	): SearchManager<TQueryName> {
		return {
			async search(text, take: number = 256) {
				const ignoreIds: unknown[] = []
				const results: Item<TQueryName>[] = []

				const queriesU = params.queries(text.toLocaleUpperCase(App.lang.ref))
				const queriesL = params.queries(text.toLocaleLowerCase(App.lang.ref))
				const queries: Where<TQueryName>[] = []
				for (let i = 0; i < queriesL.length; i++) queries.push({ OR: [queriesU[i], queriesL[i]] } as Where<TQueryName>)
				// TODO: Solution above is good enough for now, but need a more elegant solution.
				// Tbh we can index many things on db as lowercase or uppercase then on front end we can add the casing, upper, lower, capitilized etc...
				// This way we dont have to relay on person doing the mutation for casing.
				// Mutator can have the locale of the client, so it can do the lowercasing based on that

				for (const where of queries) {
					const result: Item<TQueryName>[] = await (db.query[queryName] as any).findMany({
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