import { prismaProxy } from "@/prisma/proxy"
import type { Warehouse } from "@prisma/client"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { onMount$ } from "master-ts/library/lifecycle"
import { css, html } from "master-ts/library/template"
import { WarehouseComponent } from "./warehouse"
import { WarehouseFormComponent } from "./warehouseForm"

const ComponentConstructor = defineComponent("x-warehouses-page")

export function WarehousesComponent() {
	const component = new ComponentConstructor()

	const warehouses = $.writable<Warehouse[]>([])

	async function update() {
		warehouses.ref = await prismaProxy.warehouse.findMany({})
	}

	onMount$(component, () => {
		update()
	})

	component.$html = html`
		<h2>Warehouses</h2>

		<x ${WarehouseFormComponent()} class="form"></x>

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
