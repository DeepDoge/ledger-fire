import { db } from "@/db/api"
import { SearchManager } from "@/libs/searchManager"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"
import { ProductComponent } from "./product"
import { ProductFormComponent } from "./productForm"

const searchManager = SearchManager.create(db.query.product, {
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

	const searchText = $.writable("")
	const searchTextDeferred = $.defer(searchText)

	const productsPromise = $.derive(() => searchManager.search(searchTextDeferred.ref, 1024), [searchTextDeferred])

	component.$html = html`
		<x ${ProductFormComponent()} class="form"></x>

		<input type="text" placeholder="Search" bind:value=${searchText} />

		<div class="products">
			${$.await(productsPromise).then((products) =>
				$.each(products)
					.key((product) => product.id)
					.as((product) => html` <x ${ProductComponent(product.ref)}></x> `)
			)}
		</div>
	`

	return component
}

ComponentConstructor.$css = css`
	:host {
		display: grid;
		text-transform: capitalize;
	}
`
