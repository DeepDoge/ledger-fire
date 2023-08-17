import { App } from "@/app"
import { db } from "@/db/api"
import { toLocaleCapitalized } from "@/utils/casing"
import type { Warehouse } from "@prisma/client"
import { $ } from "master-ts/library/$"
import { css, html } from "master-ts/library/template"

const Component = $.component("x-warehouse")

export function WarehouseComponent(warehouse: Warehouse) {
	const component = new Component()

	const destroyPromise = $.writable<Promise<unknown>>(Promise.resolve())
	const destroying = $.await(destroyPromise)
		.until(() => true)
		.then(() => false)
	async function destroy() {
		await destroyPromise.ref
		const confirm = await App.dialogManager.create({
			type: "confirm",
			title: "Delete Warehouse",
			message: `Are you sure you want to delete ${warehouse.name}?`,
		})
		if (!confirm) return
		destroyPromise.ref = db.mutate.deleteWarehouse({ id: warehouse.id })
	}

	component.$html = html`
		<div class="name">${() => toLocaleCapitalized(App.language.ref)(warehouse.name)}</div>
		<div class="address">${() => toLocaleCapitalized(App.language.ref)(warehouse.address)}</div>
		<button class="destroy" class:destroying=${destroying} on:click=${destroy}>Delete</button>
	`

	return component
}

Component.$css = css`
	:host {
		display: grid;
		gap: calc(var(--span) * 0.25);
		padding: calc(var(--span) * 0.5) calc(var(--span) * 1);

		background-color: hsl(var(--base--hsl));
		color: hsl(var(--base-text--hsl));
	}

	.address {
		font-size: 0.75rem;
		color: hsl(var(--base-text--hsl), 85%);
	}
`