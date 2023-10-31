import { toLocaleCapitalized } from "@app/common/utils/casing"
import type { Prisma } from "@prisma/client"
import { derive, fragment, signal } from "master-ts/core"
import { awaited, css, defineCustomTag, html, match } from "master-ts/extra"
import { tx } from "~/api/client"
import { App } from "~/app"
import { commonSheet } from "~/styles"

const productTag = defineCustomTag("x-product")
export function ProductCard(product: Prisma.ProductGetPayload<{ include: { brand: true } }>) {
    const host = productTag()
    const dom = host.attachShadow({ mode: "open" })
    dom.adoptedStyleSheets.push(commonSheet, sheet)

    const destroyPromise = signal<Promise<unknown> | null>(null)
    const destroying = match(destroyPromise)
        .case(null, () => false)
        .default((destroyPromise) =>
            awaited(
                derive(() => destroyPromise.ref.then(() => true).catch(() => false)),
                false,
            ),
        )
    async function destroy() {
        await destroyPromise.ref
        const confirm = window.confirm(["Delete Product", `Are you sure you want to delete ${product.name}?`].join("\n"))
        if (!confirm) return
        destroyPromise.ref = tx.deleteProduct({ id: product.id })
    }

    dom.append(
        fragment(html`
            <div class="name">${() => toLocaleCapitalized(App.language.ref)(product.name)}</div>
            <div class="brandName">${() => toLocaleCapitalized(App.language.ref)(product.brand.name)}</div>
            <button on:click=${destroy} disabled=${() => (destroying.ref ? "" : null)}>${() => (destroying.ref ? "Deleting..." : "Delete")}</button>
        `),
    )

    return host
}

const sheet = css`
    :host {
        display: grid;
        padding: calc(var(--span) * 2);
    }
`.toSheet()
