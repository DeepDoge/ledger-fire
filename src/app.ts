import "@/importStyles"

import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import type { TemplateValue } from "master-ts/library/template"
import { css, html } from "master-ts/library/template"
import { createDialogManager } from "./components/dialog"
import { NavigationComponent } from "./navigation"
import { route } from "./router"

export namespace App {
	export const language = $.writable(navigator.language)
	language.subscribe((lang) => (document.documentElement.lang = lang), { mode: "immediate" })
	export const dialogManager = createDialogManager()

	const ComponentConstructor = defineComponent("x-app")
	function Component() {
		const component = new ComponentConstructor()

		const routeView = $.readable<Promise<TemplateValue>>(
			(set) =>
				route.pathArr.subscribe(
					(pathArr) => {
						if (pathArr[0] === "#warehouses") {
							set(
								import("./components/warehouses").then(
									(m) => html`
										<h1>Warehouses</h1>
										${m.WarehousesComponent()}
									`
								)
							)
						} else if (pathArr[0] === "#products") {
							set(
								import("./components/products").then(
									(m) => html`
										<h1>Products</h1>
										${m.ProductsComponent()}
									`
								)
							)
						} else {
							set(Promise.resolve(null))
						}
					},
					{ mode: "immediate" }
				).unsubscribe
		)

		component.$html = html`
			<header style:grid-area=${"header"}>
				<x ${NavigationComponent()}></x>
			</header>
			<main style:grid-area=${"main"}>${$.await(routeView)}</main>
			<x ${App.dialogManager.component}></x>
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
			align-content: start;
			gap: calc(var(--span) * 1);
			padding: calc(var(--span) * 2);
		}
	`

	document.querySelector("#app")?.replaceWith(Component())
}
