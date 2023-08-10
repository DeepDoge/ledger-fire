import { db } from "@/db/api"
import { SearchManager } from "@/utils/search"
import type { Warehouse } from "@prisma/client"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { onMount$ } from "master-ts/library/lifecycle"
import { css, html } from "master-ts/library/template"
import { SearchComponent } from "./search"
import { WarehouseComponent } from "./warehouse"
import { WarehouseFormComponent } from "./warehouseForm"

const searchManager = SearchManager.create("warehouse", {
	include: undefined,
	itemIdKey: "id",
	queries(text) {
		return [
			{ name: { equals: text } },
			{ address: { equals: text } },
			{ name: { startsWith: text } },
			{ address: { startsWith: text } },
			{ name: { contains: text } },
			{ address: { contains: text } },
		]
	},
	take: 10,
})

const ComponentConstructor = defineComponent("x-warehouses-page")

export function WarehousesComponent() {
	const component = new ComponentConstructor()

	const warehouses = $.writable<Warehouse[]>([])

	async function update() {
		warehouses.ref = await db.query.warehouse.findMany({})
	}

	onMount$(component, () => {
		update()
	})

	component.$html = html`
		<h2>Warehouses</h2>

		<x ${WarehouseFormComponent()} class="form"></x>

		<x ${SearchComponent(searchManager)}></x>

		<div class="warehouses">
			${$.each(warehouses)
				.key((warehouse) => warehouse.id)
				.as((warehouse) => html` <x ${WarehouseComponent(warehouse.ref)}></x> `)}
		</div>
	`

	return component
}

ComponentConstructor.$css = css`
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
