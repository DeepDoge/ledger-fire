import { $, populate, signal } from "master-ts/core"
import { INSTANCEOF, awaited, css, defer, defineCustomTag, each, match } from "master-ts/extra"
import { query } from "~/api/client"
import { SearchManager } from "~/libs/searchManager"
import { commonSheet } from "~/styles"
import { ProductCard } from "./card"
import { ProductForm } from "./form"

const { input, div } = $

const searchManager = SearchManager.create(query.product, {
    itemIdKey: "id",
    include: { brand: true },
    queries(text) {
        return [
            { name: { startsWith: text } },
            { brand: { name: { startsWith: text } } },
            { name: { contains: text } },
            { brand: { name: { contains: text } } },
        ]
    },
})

const productsTag = defineCustomTag("x-products")
export function ProductList() {
    const host = productsTag()
    const dom = host.attachShadow({ mode: "open" })
    dom.adoptedStyleSheets.push(commonSheet, sheet)

    const searchText = signal("")
    const searchTextDeferred = defer(searchText)

    const products = awaited(async () => (searchTextDeferred.ref ? await searchManager.search(searchTextDeferred.ref, 1024) : null))

    populate(dom, [
        populate(ProductForm(), { class: "form" }),

        input({ type: "text", placeholder: "Search", "bind:value": searchText }),
        div({ class: "products" }, [
            match(products)
                .case({ [INSTANCEOF]: Array }, (products) =>
                    each(() => products.ref)
                        .key((product) => product.id)
                        .as((product) => ProductCard(product.ref)),
                )
                .default(() => "Loading..."),
        ]),
    ])

    return host
}

const sheet = css`
    :host {
        display: grid;
    }
`.toSheet()
