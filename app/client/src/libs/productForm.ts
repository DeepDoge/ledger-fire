import { fragment, signal } from "master-ts/core"
import { defineCustomTag, html } from "master-ts/extra"
import { tx } from "~/api/client"
import { commonStyle } from "~/importStyles"

const productFormTag = defineCustomTag("x-product-form")
export function ProductFormComponent() {
	const root = productFormTag()
	const dom = root.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle)

	const name = signal("")
	const brandName = signal("")

	async function onSubmit() {
		await tx.createProduct2({
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
		`),
	)

	return root
}
