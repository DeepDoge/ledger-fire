import { App } from "@/app"
import { db } from "@/db/api"
import { toLocaleCapitalized } from "@/utils/casing"
import type { Prisma } from "@prisma/client"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-product")
export function ProductComponent(product: Prisma.ProductGetPayload<{ include: { brand: true } }>) {
	const component = new ComponentConstructor()

	const destroyPromise = $.writable<Promise<unknown>>(Promise.resolve())
	const destroying = $.await(destroyPromise)
		.until(() => true)
		.then(() => false)
	async function destroy() {
		await destroyPromise.ref
		const confirm = await App.dialogManager.create({
			type: "confirm",
			title: "Delete Product",
			message: `Are you sure you want to delete ${product.name}?`,
		})
		if (!confirm) return
		destroyPromise.ref = db.mutate.deleteProduct({ id: product.id })
	}

	component.$html = html`
		<div class="name">${() => toLocaleCapitalized(App.language.ref)(product.name)}</div>
		<div class="brandName">${() => toLocaleCapitalized(App.language.ref)(product.brand.name)}</div>
		<button on:click=${destroy} disabled=${() => (destroying.ref ? "" : null)}>${() => (destroying.ref ? "Deleting..." : "Delete")}</button>
	`

	return component
}

ComponentConstructor.$css = css`
	:host {
		display: grid;
		padding: calc(var(--span) * 2);
	}
`
