import { searchProduct, type Product } from "@/utils/products"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-product-search")

export class SelectProductEvent extends CustomEvent<{ product: Product }> {
	constructor(product: Product) {
		super("select-product", { detail: { product } })
	}
}

export function ProductSearchComponent() {
	const component = new ComponentConstructor()

	const searchText = $.writable("")
	const searchTextDeferred = $.deferred(searchText)

	const results = $.await($.derive(async () => (searchTextDeferred.ref ? await searchProduct(searchTextDeferred.ref) : [])))
		.placeholder(() => null)
		.then()

	const selectedIndex = $.writable(0)
	const selected = $.derive(() => results.ref?.[selectedIndex.ref] ?? null)
	$.effect$(component, () => (selectedIndex.ref = 0), [results])

	function dispatchEventForSelected() {
		if (selected.ref) component.dispatchEvent(new SelectProductEvent(selected.ref))
	}

	function selectAndDispatch(index: number) {
		selectedIndex.ref = index
		dispatchEventForSelected()
	}

	function incrementSelectedIndex() {
		selectedIndex.ref = (selectedIndex.ref + 1) % results.ref!.length
	}

	function decrementSelectedIndex() {
		selectedIndex.ref = (selectedIndex.ref - 1 + results.ref!.length) % results.ref!.length
	}

	function onKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case "ArrowUp":
				decrementSelectedIndex()
				break
			case "ArrowDown":
				incrementSelectedIndex()
				break
		}
	}

	component.$html = html`
		<form on:submit=${(event) => (event.preventDefault(), dispatchEventForSelected())}>
			<input type="text" placeholder="Search for products..." bind:value=${searchText} on:keydown=${onKeyDown} />
			<div class="results">
				${$.match(results)
					.case(null, () => null)
					.default((results) =>
						$.each(results)
							.key((product) => product.id)
							.as(
								(product, index) => html`
									<div
										class="item"
										on:click=${() => selectAndDispatch(index.ref)}
										class:selected=${() => index.ref === selectedIndex.ref}>
										<div class="name">${() => product.ref.name}</div>
										<div class="brand">${() => product.ref.brand.name}</div>
									</div>
								`
							)
					)}
			</div>
		</form>
	`

	return component
}

ComponentConstructor.$css = css`
	:host {
		display: contents;
	}

	form {
		display: grid;
		position: relative;
		height: 2em;
	}

	.results {
		position: absolute;
		top: 100%;
		height: 50vh;
		left: 0;
		right: 0;
		overflow: auto;
		background-color: hsl(var(--background--hsl));
		color: hsl(var(--background-text--hsl));
		border: solid 0.1em hsl(var(--primary--hsl));
		border-radius: var(--radius);
	}

	.item {
		display: grid;
		grid-template-columns: 1fr 1fr;
		padding: calc(var(--span) * 0.5);
	}

	.item.selected {
		background-color: hsl(var(--primary--hsl));
		color: hsl(var(--primary-text--hsl));
	}
`
