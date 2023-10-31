import type { Warehouse } from "@prisma/client"
import { fragment, onConnected$, signal } from "master-ts/core"
import { css, defineCustomTag, each, html } from "master-ts/extra"
import { query } from "~/api/client"
import { SearchManager } from "~/libs/searchManager"
import { commonSheet } from "~/styles"
import { WarehouseCard } from "./card"
import { WarehouseForm } from "./form"

const searchManager = SearchManager.create(query.warehouse, {
    itemIdKey: "id",
    queries(text) {
        return [{ name: { startsWith: text } }, { address: { startsWith: text } }, { name: { contains: text } }, { address: { contains: text } }]
    },
})

const warehousesTag = defineCustomTag("x-warehouses")

export function WarehouseList() {
    const host = warehousesTag()
    const dom = host.attachShadow({ mode: "open" })
    dom.adoptedStyleSheets.push(commonSheet, sheet)

    const warehouses = signal<Warehouse[]>([])

    async function update() {
        warehouses.ref = await query.warehouse.findMany({})
    }

    onConnected$(host, () => {
        update()
    })
    update()

    dom.append(
        fragment(html`
            <x ${WarehouseForm()} class="form"></x>

            <div class="warehouses">
                ${each(warehouses)
                    .key((warehouse) => warehouse.id)
                    .as((warehouse) => html` <x ${WarehouseCard(warehouse.ref)}></x> `)}
            </div>
        `),
    )

    return host
}

const sheet = css`
    :host {
        display: grid;
        gap: calc(var(--span) * 0.25);
        align-content: start;
    }

    .warehouses {
        display: grid;
        gap: calc(var(--span) * 0.5);
    }
`.toSheet()
