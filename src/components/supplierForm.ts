import { db } from "@/db/api"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-supplier-form")
export function SupplierFormComponent() {
	const component = new ComponentConstructor()

	const name = $.writable("")
	const address = $.writable("")
	const phone = $.writable("")
	const email = $.writable("")
	const taxNumber = $.writable("")

	async function onSubmit() {
		await db.mutate.createSupplierAccount({
			name: name.ref,
			address: address.ref,
			email: email.ref,
			phone: phone.ref,
			taxNumber: taxNumber.ref,
		})
	}

	component.$html = html`
		<form on:submit=${(event) => (event.preventDefault(), onSubmit())}>
			<input type="text" placeholder="Full Name" bind:value=${name} />
			<input type="text" placeholder="Address" bind:value=${address} />

			<button type="submit">Create</button>
		</form>
	`

	return component
}
