import { createPage } from "@/routes"
import { defineComponent } from "master-ts/library/component"
import { html } from "master-ts/library/template"

export const homeLayout = createPage(() => {
	const PageComponent = defineComponent("x-home-page")
	const page = new PageComponent()
	page.$html = html` <h1>Home</h1> `

	return {
		component: page,
	}
})
