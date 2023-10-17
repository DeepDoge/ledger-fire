import "~/styles"

import { Template, fragment, signal } from "master-ts/core"
import { css, defineCustomTag, html } from "master-ts/extra"
import { DialogComponent } from "~/libs/dialog"
import { createDialogManager } from "~/libs/dialogManager"
import { ProductsComponent } from "~/libs/products"
import { WarehousesComponent } from "~/libs/warehouses"
import { NavigationComponent } from "~/navigation"
import { route } from "~/router"
import { commonStyle } from "~/styles"

export namespace App {
	export const language = signal(navigator.language)
	language.follow((lang) => (document.documentElement.lang = lang), { mode: "immediate" })
	export const dialogManager = createDialogManager()

	const appTag = defineCustomTag("x-app")
	function AppComponent() {
		const host = appTag()
		const dom = host.attachShadow({ mode: "open" })
		dom.adoptedStyleSheets.push(commonStyle, style)

		const routeView = signal<Template.Member>(
			null!,
			(set) =>
				route.pathArr.follow(
					(pathArr) => {
						if (pathArr[0] === "#warehouses") {
							set(html`
								<h1>Warehouses</h1>
								${WarehousesComponent()}
							`)
						} else if (pathArr[0] === "#products") {
							set(html`
								<h1>Products</h1>
								${ProductsComponent()}
							`)
						} else {
							set(null)
						}
					},
					{ mode: "immediate" },
				).unfollow,
		)

		dom.append(
			fragment(html`
				<header style:grid-area=${"header"}>
					<x ${NavigationComponent()}></x>
				</header>
				<main style:grid-area=${"main"}>${routeView}</main>
				<x ${DialogComponent(dialogManager)}></x>
			`),
		)

		return host
	}

	const style = css`
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

	document.querySelector("#app")?.replaceWith(AppComponent())
}
