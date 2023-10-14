import { db } from "@/db/api"
import { commonStyle } from "@/importStyles"
import { SearchManager } from "@/libs/searchManager"
import { derive, fragment, signal } from "master-ts/core"
import { awaited, css, defer, defineCustomTag, each, flatten, html, match } from "master-ts/extra"
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

const productsTag = defineCustomTag("x-products")
export function ProductsComponent() {
	const root = productsTag()
	const dom = root.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	const searchText = signal("")
	const searchTextDeferred = defer(searchText)

	const products = flatten(derive(() => awaited(searchManager.search(searchTextDeferred.ref, 1024)), [searchTextDeferred]))

	dom.append(
		fragment(html`
			<x ${ProductFormComponent()} class="form"></x>

			<input type="text" placeholder="Search" bind:value=${searchText} />

			<div class="products">
				${match(products)
					.case(null, () => null)
					.default((products) =>
						each(products)
							.key((product) => product.id)
							.as((product) => html` <x ${ProductComponent(product.ref)}></x> `)
					)}
			</div>
		`)
	)

	return root
}

const style = css`
	:host {
		display: grid;
	}
`
