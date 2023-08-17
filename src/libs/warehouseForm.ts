import { db } from "@/db/api"
import { $ } from "master-ts/library/$"
import { html } from "master-ts/library/template"

const Component = $.component("x-warehouse-form")
export function WarehouseFormComponent() {
	const component = new Component()

	const name = $.writable("")
	const address = $.writable("")

	async function onSubmit() {
		await db.mutate.createWarehouse({
			name: name.ref,
			address: address.ref,
		})
	}

	component.$html = html`
		<form on:submit=${(event) => (event.preventDefault(), onSubmit())}>
			<input type="text" placeholder="Name" bind:value=${name} />
			<input type="text" placeholder="Address" bind:value=${address} />
			<button type="submit">Create</button>
		</form>
	`

	return component
}
