import { db } from "@/db/api"
import { commonStyle } from "@/importStyles"
import { fragment, signal } from "master-ts/core"
import { defineCustomTag, html } from "master-ts/extra"

const warehouseTag = defineCustomTag("x-warehouse-form")
export function WarehouseFormComponent() {
	const root = warehouseTag()
	const dom = root.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle)

	const name = signal("")
	const address = signal("")

	async function onSubmit() {
		await db.mutate.createWarehouse({
			name: name.ref,
			address: address.ref,
		})
	}

	dom.append(
		fragment(html`
			<form on:submit=${(event) => (event.preventDefault(), onSubmit())}>
				<input type="text" placeholder="Name" bind:value=${name} />
				<input type="text" placeholder="Address" bind:value=${address} />
				<button type="submit">Create</button>
			</form>
		`)
	)

	return root
}
