import { db } from "@/db/api"
import { $ } from "master-ts/library/$"
import { html } from "master-ts/library/template"

const ComponentConstructor = $.component("x-product-form")
export function ProductFormComponent() {
	const component = new ComponentConstructor()

	const name = $.writable("")
	const brandName = $.writable("")

	async function onSubmit() {
		await db.mutate.createProduct2({
			name: name.ref,
			brandName: brandName.ref,
		})
	}

	component.$html = html`
		<form on:submit=${(event) => (event.preventDefault(), onSubmit())}>
			<input type="text" placeholder="Name" bind:value=${name} />
			<input type="text" placeholder="Brand Name" bind:value=${brandName} />
			<button type="submit">Create</button>
		</form>
	`

	return component
}
