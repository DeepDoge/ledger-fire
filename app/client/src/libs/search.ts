import { derive, fragment, signal } from "master-ts/core"
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
	const selectedItem = derive(() => results.ref?.[selectedIndex.ref] ?? null)
	selectedItem.follow$(host, onSelect)
	results.follow$(host, () => (selectedIndex.ref = 0))
	function selectByIndex(index: number) {
		selectedIndex.ref = index
	}
	function incrementSelectedIndex() {
		selectedIndex.ref = (selectedIndex.ref + 1) % results.ref!.length
	}
	function decrementSelectedIndex() {
		selectedIndex.ref = (selectedIndex.ref - 1 + results.ref!.length) % results.ref!.length
	}

	const searchElement = html`
		<input type="text" placeholder="Search for products..." bind:value=${searchText} on:keydown=${onSelectElementKeyDown} />
	`[0] as HTMLInputElement
	function onSelectElementKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case "ArrowUp":
				decrementSelectedIndex()
				break
			case "ArrowDown":
				incrementSelectedIndex()
				break
		}
	}

	dom.append(
		fragment(html`
			${() => JSON.stringify(selectedItem.ref, null, "\t")}
			<form on:submit=${(event) => (event.preventDefault(), searchElement.blur())}>${searchElement}</form>
			<div class="results">
				${match(results)
					.case(null, () => null)
					.default((results) =>
						each(results)
							.key((_, index) => index)
							.as(
								(item, index) => html`
									<button
										class="item"
										on:click=${() => selectByIndex(index.ref)}
										class:selected=${derive(() => index.ref === selectedIndex.ref)}>
										${index} ${JSON.stringify(item, null, "\t")}
									</button>
								`,
							),
					)}
			</div>
		`),
	)

	return host
}

const style = css`
	:host {
		display: grid;
		position: relative;
	}

	form {
		display: contents;
	}

	form:not(:focus-within) + .results {
		display: none;
	}
	.results {
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
		grid-template-columns: 1fr 1fr;
		padding: calc(var(--span) * 0.5);
	}

	.item.selected {
		background-color: hsl(var(--primary--hsl));
		color: hsl(var(--primary-text--hsl));
	}
`
