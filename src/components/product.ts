import { prismaProxy } from "@/prisma/proxyClient"
import type { Product } from "@prisma/client"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"

const XProduct = defineComponent("x-product")
export function ProductComponent(product: Product) {
	const component = new XProduct()

	component.$html = html`
		<div class="name">${product.name}</div>
		<div class="brandName">${$.await(prismaProxy.brand.findUniqueOrThrow({ where: { id: product.brandId } })).then((brand) => brand.name)}</div>
	`

	return component
}

XProduct.$css = css`
	:host {
		display: grid;
		padding: calc(var(--span) * 2);
	}
`
