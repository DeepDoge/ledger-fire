import { transaction } from "@/indexer/transactionClient"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { html } from "master-ts/library/template"

const XProductForm = defineComponent("x-product-form")
export function ProductFormComponent() {
	const component = new XProductForm()

	const name = $.writable("")
	const brandName = $.writable("")

	async function onSubmit() {
		await transaction.createProduct2(name.ref, brandName.ref)
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