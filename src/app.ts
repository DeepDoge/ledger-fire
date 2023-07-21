import "@/import-styles"

import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"
import { DialogComponent, createDialogManager } from "./components/dialog"
import { NavigationComponent } from "./navigation"
import { route } from "./router"

export const dialogManager = createDialogManager()

const ComponentConstructor = defineComponent("x-app")
function AppComponent() {
	const component = new ComponentConstructor()

	component.$html = html`
		<header style:grid-area=${"header"}>
			<x ${NavigationComponent()}></x>
		</header>
		<main style:grid-area=${"main"}>
			${() => {
				if (route.pathArr.ref[0] === "#warehouses") {
					return $.await(import("./components/warehouses")).then((m) => m.WarehousesComponent())
				}

				return null
			}}
		</main>
		<x ${DialogComponent(dialogManager)}></x>
	`

	return component
}

ComponentConstructor.$css = css`
	:host {
		display: grid;
		grid-template-areas: "header main";
		grid-template-columns: minmax(0, 10em) 1fr;
	}

	header {
		display: grid;

		position: sticky;
		top: 0;
		height: 100vh;
	}

	main {
		display: grid;

		padding: calc(var(--span) * 2);
	}
`

document.querySelector("#app")?.replaceWith(AppComponent())
