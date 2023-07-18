import { ProductComponent } from "@/components/product"
import { ProductFormComponent } from "@/components/productForm"
import { prismaProxy } from "@/prisma/proxyClient"
import { createPage } from "@/routes"
import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { html } from "master-ts/library/template"

export const homeLayout = createPage(() => {
	const PageComponent = defineComponent("x-home-page")
	const page = new PageComponent()

	const test = prismaProxy.product.findMany()

	page.$html = html`
		<x ${ProductFormComponent()}></x>
		${$.await(test).then((products) => $.each(products).as((product) => ProductComponent(product)))}
	`

	return {
		component: page,
	}
})
