import { db } from "@/db/api"
import { commonStyle } from "@/importStyles"
import { fragment, signal } from "master-ts/core"
import { defineCustomTag, html } from "master-ts/extra"

const productFormTag = defineCustomTag("x-product-form")
export function ProductFormComponent() {
	const root = productFormTag()
	const dom = root.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle)

	const name = signal("")
	const brandName = signal("")

	async function onSubmit() {
		await db.mutate.createProduct2({
			name: name.ref,
			brandName: brandName.ref,
		})
	}

	dom.append(
		fragment(html`
			<form on:submit=${(event) => (event.preventDefault(), onSubmit())}>
				<input type="text" placeholder="Name" bind:value=${name} />
				<input type="text" placeholder="Brand Name" bind:value=${brandName} />
				<button type="submit">Create</button>
			</form>
		`)
	)

	return root
}
