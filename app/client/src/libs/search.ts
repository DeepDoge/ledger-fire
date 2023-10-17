import { derive, populate, signal } from "master-ts/core"
import { awaited, css, defer, defineCustomTag, each, html, match } from "master-ts/extra"
import type { SearchManager } from "~/libs/searchManager"
import { commonStyle } from "~/styles"

const searchTag = defineCustomTag("x-search")

export function SearchComponent<TSearchManager extends SearchManager>(
	searchManager: TSearchManager,
	onSelect: (item: Awaited<ReturnType<TSearchManager["search"]>>[0] | null) => any,
) {
	const host = searchTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	const searchText = signal("")
	const searchTextDeferred = defer(searchText)
	const results = awaited(derive(() => searchManager.search(searchTextDeferred.ref), [searchTextDeferred]))

	const selectedIndex = signal(0)
	const selectedItem = derive(() => results.ref?.[selectedIndex.ref] ?? null, [results, selectedIndex])
	selectedItem.follow$(host, onSelect)
	results.follow$(host, () => (selectedIndex.ref = 0))
	function incrementSelectedIndex() {
		selectedIndex.ref = (selectedIndex.ref + 1) % results.ref!.length
	}
	function decrementSelectedIndex() {
		selectedIndex.ref = (selectedIndex.ref - 1 + results.ref!.length) % results.ref!.length
	}

	const searchElement = html`
		<input type="text" id="search" placeholder="Search for products..." bind:value=${searchText} />
	`[0] as HTMLInputElement
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

	populate(
		dom,
		html`
			${() => JSON.stringify(selectedItem.ref, null, "\t")}
			<form on:submit=${(event) => (event.preventDefault(), searchElement.blur())} on:keydown=${onKeyDown}>
				${searchElement}
				<label for="search" id="results">
					${match(results)
						.case(null, () => null)
						.default((results) =>
							each(results)
								.key((_, index) => index)
								.as(
									(item, index) => html`
										<button
											class="item"
											on:click=${() => (selectedIndex.ref = index.ref)}
											class:selected=${derive(() => index.ref === selectedIndex.ref)}>
											${index} ${JSON.stringify(item, null, "\t")}
										</button>
									`,
								),
						)}
				</div>
			</form>
		`,
	)

	return host
}

const style = css`
	:host {
		display: contents;
	}

	form {
		display: grid;
		position: relative;
	}

	form:not(:focus-within) #results {
		display: none;
	}
	#results {
		display: grid;
		justify-content: start;
		grid-auto-flow: row;
		position: absolute;
		top: 100%;
		max-height: 50vh;
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
		text-align: left;
		grid-template-columns: 1fr 1fr;
		padding: calc(var(--span) * 0.5);
	}

	.item.selected {
		background-color: hsl(var(--primary--hsl));
		color: hsl(var(--primary-text--hsl));
	}
`
