import { tx } from "@/api/client"
import { App } from "@/app"
import { commonStyle } from "@/importStyles"
import { toLocaleCapitalized } from "@/utils/casing"
import type { Prisma } from "@prisma/client"
import { derive, fragment, signal } from "master-ts/core"
import { awaited, css, defineCustomTag, flatten, html } from "master-ts/extra"

const productTag = defineCustomTag("x-product")
export function ProductComponent(product: Prisma.ProductGetPayload<{ include: { brand: true } }>) {
	const root = productTag()
	const dom = root.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	const destroyPromise = signal<Promise<unknown>>(Promise.reject())
	const destroying = flatten(
		derive(() =>
			awaited(
				destroyPromise.ref.then(() => true).catch(() => false),
				false
			)
		)
	)
	async function destroy() {
		await destroyPromise.ref
		const confirm = await App.dialogManager.create({
			type: "confirm",
			title: "Delete Product",
			message: `Are you sure you want to delete ${product.name}?`,
		})
		if (!confirm) return
		destroyPromise.ref = tx.deleteProduct({ id: product.id })
	}

	dom.append(
		fragment(html`
			<div class="name">${() => toLocaleCapitalized(App.language.ref)(product.name)}</div>
			<div class="brandName">${() => toLocaleCapitalized(App.language.ref)(product.brand.name)}</div>
			<button on:click=${destroy} disabled=${() => (destroying.ref ? "" : null)}>${() => (destroying.ref ? "Deleting..." : "Delete")}</button>
		`)
	)

	return root
}

const style = css`
	:host {
		display: grid;
		padding: calc(var(--span) * 2);
	}
`
