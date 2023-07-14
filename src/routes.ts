import { homeLayout } from "@/pages/home"
import { route } from "@/router"
import { $ } from "master-ts/library/$"
import type { Component } from "master-ts/library/component"
import type { SignalReadable, SignalWritable } from "master-ts/library/signal"
import { unknownLayout } from "./pages/unknown"

export type Layout = {
	component: Component
}

export function createPage<T extends Record<PropertyKey, unknown> = Record<PropertyKey, never>>(
	factory: (params: { [K in keyof T]: SignalReadable<T[K]> }) => Layout
) {
	let cache: Layout | null = null
	let paramSignals: { [K in keyof T]: SignalWritable<T[K]> }
	return (params: T) => {
		if (cache) {
			const entries = Object.entries(paramSignals) as [keyof typeof paramSignals, (typeof paramSignals)[keyof typeof paramSignals]][]
			entries.forEach(([key, signal]) => (signal.ref = params[key]))
		} else {
			cache = factory(
				(paramSignals = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, $.writable(value)])) as {
					[K in keyof T]: SignalWritable<T[K]>
				})
			)
		}
		return cache
	}
}

export const routerLayout = $.readable<Layout>((set) => {
	const sub = route.pathArr.subscribe(
		(path) => {
			if (path[0] === "") {
				set(homeLayout({}))
			} else {
				set(unknownLayout({}))
			}
		},
		{ mode: "immediate" }
	)

	return () => {
		console.log("unsub")
		sub.unsubscribe()
	}
})
