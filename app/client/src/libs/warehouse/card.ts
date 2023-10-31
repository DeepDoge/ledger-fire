import { toLocaleCapitalized } from "@app/common/utils/casing"
import type { Warehouse } from "@prisma/client"
import { derive, fragment, signal } from "master-ts/core"
import { awaited, css, defineCustomTag, html, match } from "master-ts/extra"
import { tx } from "~/api/client"
import { App } from "~/app"
import { commonSheet } from "~/styles"

const warehouseTag = defineCustomTag("x-warehouse")

export function WarehouseCard(warehouse: Warehouse) {
    const host = warehouseTag()
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
        const confirm = window.confirm(["Delete Warehouse", , `Are you sure you want to delete ${warehouse.name}?`].join("\n"))
        if (!confirm) return
        destroyPromise.ref = tx.deleteWarehouse({ id: warehouse.id })
    }

    dom.append(
        fragment(html`
            <div class="name">${() => toLocaleCapitalized(App.language.ref)(warehouse.name)}</div>
            <div class="address">${() => toLocaleCapitalized(App.language.ref)(warehouse.address)}</div>
            <button class="destroy" class:destroying=${destroying} on:click=${destroy}>Delete</button>
        `),
    )

    return host
}

const sheet = css`
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
`.toSheet()
