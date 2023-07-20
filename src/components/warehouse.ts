import type { Warehouse } from "@prisma/client"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-warehouse")

export function WarehouseComponent(warehouse: Warehouse) {
	const component = new ComponentConstructor()

	component.$html = html`
		<div class="name">${warehouse.name}</div>
		<div class="address">${warehouse.address}</div>
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
