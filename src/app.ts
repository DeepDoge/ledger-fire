import "@/import-styles"

import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"
import { DialogComponent, type Dialog } from "./components/dialog"
import { NavigationComponent } from "./navigation"
import { route } from "./router"

const dialogs = $.writable<Dialog[]>([])
export async function createDialog(init: Omit<Dialog, "resolver" | "id">) {
	return new Promise((resolve) => {
		const dialog = {
			id: Symbol(),
			...init,
			resolver(...args: Parameters<typeof resolve>) {
				dialogs.ref = dialogs.ref.filter((dialog) => dialog.id !== dialog.id)
				resolve(...args)
			},
		}

		dialogs.ref.push(dialog as Dialog)
		dialogs.signal()
	})
}

createDialog({
	type: "alert",
	title: "Hello",
	message: "World ".repeat(10000),
	confirm: "Hello World",
})

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
		<x ${DialogComponent(dialogs)}></x>
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
