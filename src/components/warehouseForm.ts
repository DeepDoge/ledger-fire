import { transaction } from "@/transactions/transactionClient"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-warehouse-form")
export function WarehouseFormComponent() {
	const component = new ComponentConstructor()

	const name = $.writable("")
	const address = $.writable("")

	async function onSubmit() {
		await transaction.createWarehouse({
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
