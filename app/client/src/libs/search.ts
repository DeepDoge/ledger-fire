import { derive, fragment, signal } from "master-ts/core"
import { awaited, css, defer, defineCustomTag, each, html, match } from "master-ts/extra"
import { commonStyle } from "~/importStyles"
import type { SearchManager } from "~/libs/searchManager"

const searchTag = defineCustomTag("x-search")

export function SearchComponent<TSearchManager extends SearchManager>(
	searchManager: TSearchManager,
	onSelect: (item: Awaited<ReturnType<TSearchManager["search"]>>[0] | null) => any,
) {
	const root = searchTag()
	const dom = root.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	const searchText = signal("")
	const searchTextDeferred = defer(searchText)

	const results = awaited(derive(() => searchManager.search(searchTextDeferred.ref), [searchTextDeferred]))

	const active = signal(false)
	results.follow$(root, updateActive)
	function updateActive() {
		active.ref = (results.ref?.length ?? 0) > 0
	}

	const selectedIndex = signal(0)
	const selected = derive(() => results.ref?.[selectedIndex.ref] ?? null)
	selected.follow$(root, onSelect)
	results.follow$(root, () => (selectedIndex.ref = 0))

	function selectByIndex(index: number) {
		selectedIndex.ref = index
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

	function close() {
		active.ref = false
		searchElement.ref?.blur()
	}

	const searchElement = signal<HTMLInputElement | null>(null)

	dom.append(
		fragment(html`
			${() => JSON.stringify(selected.ref, null, "\t")}
			<form on:submit=${(event) => (event.preventDefault(), close())} on:focusout=${close} on:focusin=${updateActive}>
				<input ref:=${searchElement} type="text" placeholder="Search for products..." bind:value=${searchText} on:keydown=${onKeyDown} />
			</form>
			<div class="results" class:active=${active}>
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

	return root
}

const style = css`
	:host {
		display: grid;
		position: relative;
	}

	form {
		display: contents;
	}

	.results:not(.active) {
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
