import type { Prisma } from "@prisma/client"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-product")
export function ProductComponent(product: Prisma.ProductGetPayload<{ include: { brand: true } }>) {
	const component = new ComponentConstructor()

	component.$html = html`
		<div class="name">${product.name}</div>
		<div class="brandName">${product.brand.name}</div>
	`

	return component
}

ComponentConstructor.$css = css`
	:host {
		display: grid;
		padding: calc(var(--span) * 2);
	}
`
