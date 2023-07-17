import "@/import-styles"

import { routerLayout } from "@/routes"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"
import { prismaProxy } from "./prisma/proxyClient"

const AppComponent = defineComponent("x-app")
function App() {
	const component = new AppComponent()

	const brandNamesPromise = prismaProxy.brand.findMany().then((brands) => brands.map((brand) => brand.name))

	component.$html = html`
		<header>${$.await(brandNamesPromise)}</header>
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
