import { tx } from "@/api/client"
import { App } from "@/app"
import { commonStyle } from "@/importStyles"
import { toLocaleCapitalized } from "@app/common/utils/casing"
import type { Warehouse } from "@prisma/client"
import { derive, fragment, signal } from "master-ts/core"
import { awaited, css, defineCustomTag, flatten, html } from "master-ts/extra"

const warehouseTag = defineCustomTag("x-warehouse")

export function WarehouseComponent(warehouse: Warehouse) {
	const root = warehouseTag()
	const dom = root.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	const destroyPromise = signal<Promise<unknown>>(Promise.reject())
	const destroying = flatten(
		derive(() =>
			awaited(
				destroyPromise.ref.catch(() => false).then(() => true),
				false
			)
		)
	)
	async function destroy() {
		await destroyPromise.ref
		const confirm = await App.dialogManager.create({
			type: "confirm",
			title: "Delete Warehouse",
			message: `Are you sure you want to delete ${warehouse.name}?`,
		})
		if (!confirm) return
		destroyPromise.ref = tx.deleteWarehouse({ id: warehouse.id })
	}

	dom.append(
		fragment(html`
			<div class="name">${() => toLocaleCapitalized(App.language.ref)(warehouse.name)}</div>
			<div class="address">${() => toLocaleCapitalized(App.language.ref)(warehouse.address)}</div>
			<button class="destroy" class:destroying=${destroying} on:click=${destroy}>Delete</button>
		`)
	)

	return root
}

const style = css`
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
