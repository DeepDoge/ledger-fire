import "@/import-styles"

import { routerLayout } from "@/routes"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const AppComponent = defineComponent("x-app")
function App() {
	const component = new AppComponent()

	component.$html = html`
		<header></header>
		<main>${() => routerLayout.ref.component}</main>
	`

	return component
}

AppComponent.$css = css`
	:host {
		display: grid;
	}

	header {
		display: grid;

		position: fixed;
		bottom: 0;
		width: 100%;
		z-index: 10;

		pointer-events: none;
		& > * {
			pointer-events: all;
		}
	}

	main {
		display: grid;
	}
`

document.querySelector("#app")?.replaceWith(App())
