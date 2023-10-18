import type { Warehouse } from "@prisma/client"
import { fragment, onConnected$, signal } from "master-ts/core"
import { css, defineCustomTag, each, html } from "master-ts/extra"
import { query } from "~/api/client"
import { SearchManager } from "~/libs/searchManager"
import { commonStyle } from "~/styles"
import { WarehouseComponent } from "./warehouse"
import { WarehouseFormComponent } from "./warehouseForm"

const searchManager = SearchManager.create(query.warehouse, {
	itemIdKey: "id",
	queries(text) {
		return [{ name: { startsWith: text } }, { address: { startsWith: text } }, { name: { contains: text } }, { address: { contains: text } }]
	},
})

const warehousesTag = defineCustomTag("x-warehouses")

export function WarehousesComponent() {
	const host = warehousesTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	const warehouses = signal<Warehouse[]>([])

	async function update() {
		warehouses.ref = await query.warehouse.findMany({})
	}

	onConnected$(host, () => {
		update()
	})

	dom.append(
		fragment(html`
			<x ${WarehouseFormComponent()} class="form"></x>

			<div class="warehouses">
				${each(warehouses)
					.key((warehouse) => warehouse.id)
					.as((warehouse) => html` <x ${WarehouseComponent(warehouse.ref)}></x> `)}
			</div>
		`),
	)

	return host
}

const style = css`
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
