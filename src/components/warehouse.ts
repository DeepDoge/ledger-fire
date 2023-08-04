import { dialogManager } from "@/app"
import { transaction } from "@/transactions/transactionClient"
import type { Warehouse } from "@prisma/client"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-warehouse")

export function WarehouseComponent(warehouse: Warehouse) {
	const component = new ComponentConstructor()

	const destroyPromise = $.writable<Promise<unknown>>(Promise.resolve())
	const destroying = $.await(destroyPromise)
		.until(() => true)
		.then(() => false)
	async function destroy() {
		await destroyPromise.ref
		const confirm = await dialogManager.create({
			type: "confirm",
			title: "Delete Warehouse",
			message: `Are you sure you want to delete ${warehouse.name}?`,
		})
		if (!confirm) return
		destroyPromise.ref = transaction.deleteWarehouse({ id: warehouse.id })
	}

	component.$html = html`
		<div class="name">${warehouse.name}</div>
		<div class="address">${warehouse.address}</div>
		<button class="destroy" class:destroying=${destroying} on:click=${destroy}>Delete</button>
	`

	return component
}

ComponentConstructor.$css = css`
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
