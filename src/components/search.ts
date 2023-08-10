import type { SearchManager } from "@/utils/search"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-search")

export function SearchComponent<TSearchManager extends SearchManager>(searchManager: TSearchManager) {
	const component = new ComponentConstructor()

	const searchText = $.writable("")
	const searchTextDeferred = $.defer(searchText)

	const results = $.await(
		$.derive(async () => (searchTextDeferred.ref ? await searchManager.search(searchTextDeferred.ref) : []), [searchTextDeferred])
	)
		.until(() => null)
		.then()

	const active = $.writable(false)
	results.subscribe$(component, updateActive)
	function updateActive() {
		active.ref = (results.ref?.length ?? 0) > 0
	}

	const selectedIndex = $.writable(0)
	const selected = $.derive(() => results.ref?.[selectedIndex.ref] ?? null)
	$.effect$(component, () => (selectedIndex.ref = 0), [results])

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

	const searchElement = $.writable<HTMLInputElement | null>(null)

	component.$html = html`
		${() => JSON.stringify(selected.ref, null, "\t")}
		<form on:submit=${(event) => (event.preventDefault(), close())} on:focusout=${close} on:focusin=${updateActive}>
			<input ref:=${searchElement} type="text" placeholder="Search for products..." bind:value=${searchText} on:keydown=${onKeyDown} />
		</form>
		<div class="results" class:active=${active}>
			${() =>
				results.ref &&
				$.each(results.ref).as(
					(item, index) => html`
						<button class="item" on:click=${() => selectByIndex(index)} class:selected=${$.derive(() => index === selectedIndex.ref)}>
							${index} ${JSON.stringify(item, null, "\t")}
						</button>
					`
				)}
		</div>
	`

	return component
}

ComponentConstructor.$css = css`
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
