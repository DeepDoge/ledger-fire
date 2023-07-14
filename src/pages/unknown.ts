import { createPage } from "@/routes"
import { defineComponent } from "master-ts/library/component"
import { html } from "master-ts/library/template"

export const unknownLayout = createPage(() => {
	const PageComponent = defineComponent("x-unknown-layout-page")
	const page = new PageComponent()
	page.$html = html` <h1>Unknown Page</h1> `

	return {
		component: page,
	}
})
