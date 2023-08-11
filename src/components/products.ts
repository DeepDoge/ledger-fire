import { SearchManager } from "@/utils/search"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const searchManager = SearchManager.create("product", {
	itemIdKey: "id",
	include: { brand: true },
	queries(text) {
		return [
			{ name: { startsWith: text } },
			{ brand: { name: { startsWith: text } } },
			{ name: { contains: text } },
			{ brand: { name: { contains: text } } },
		]
	},
})

const ComponentConstructor = defineComponent("x-products")
export function ProductsComponent() {
	const component = new ComponentConstructor()

	component.$html = html``

	return component
}

ComponentConstructor.$css = css`
	:host {
		display: grid;
	}
`
