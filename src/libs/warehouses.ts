import { db } from "@/db/api"
import { SearchManager } from "@/libs/searchManager"
import type { Warehouse } from "@prisma/client"
import { $ } from "master-ts/library/$"
import { onMount$ } from "master-ts/library/lifecycle"
import { css, html } from "master-ts/library/template"
import { SearchComponent } from "./search"
import { WarehouseComponent } from "./warehouse"
import { WarehouseFormComponent } from "./warehouseForm"

const searchManager = SearchManager.create(db.query.warehouse, {
	itemIdKey: "id",
	queries(text) {
		return [{ name: { startsWith: text } }, { address: { startsWith: text } }, { name: { contains: text } }, { address: { contains: text } }]
	},
})

const Component = $.component("x-warehouses-page")

export function WarehousesComponent() {
	const component = new Component()

	const warehouses = $.writable<Warehouse[]>([])

	async function update() {
		warehouses.ref = await db.query.warehouse.findMany({})
	}

	onMount$(component, () => {
		update()
	})

	component.$html = html`
		<x ${WarehouseFormComponent()} class="form"></x>

		<x ${SearchComponent(searchManager, (item) => console.log(item))}></x>

		<div class="warehouses">
			${$.each(warehouses)
				.key((warehouse) => warehouse.id)
				.as((warehouse) => html` <x ${WarehouseComponent(warehouse.ref)}></x> `)}
		</div>
	`

	return component
}

Component.$css = css`
	:host {
		display: grid;
		gap: calc(var(--span) * 0.25);
		align-content: start;
	}

	.warehouses {
		display: grid;
		gap: calc(var(--span) * 0.5);
	}
`