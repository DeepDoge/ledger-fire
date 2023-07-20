import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"
import { routeHash } from "./router"

const ComponentConstructor = defineComponent("x-navigation")

export function NavigationComponent() {
	const component = new ComponentConstructor()

	component.$html = html`
		<nav>
			<a href=${routeHash({ path: "warehouses" })}>Warehouses</a>
		</nav>
	`

	return component
}

ComponentConstructor.$css = css`
	:host {
		display: contents;
	}

	nav {
		display: grid;
		gap: calc(var(--span) * 0.25);
		padding: calc(var(--span) * 0.5);
		align-content: start;

		background-color: hsl(var(--base--hsl));
	}

	nav > * {
		background-color: hsl(var(--background--hsl));
		color: hsl(var(--background-text--hsl));
		padding: calc(var(--span) * 0.5);
		border-radius: var(--radius);
	}
`
