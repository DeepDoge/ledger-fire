import "@/import-styles"

import { routerLayout } from "@/routes"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const AppComponent = defineComponent("x-app")
function App() {
	const component = new AppComponent()

	component.$html = html` <main>${() => routerLayout.ref.component}</main> `

	return component
}

AppComponent.$css = css`
	:host {
		display: grid;
	}

	main {
		display: grid;
	}
`

document.querySelector("#app")?.replaceWith(App())
