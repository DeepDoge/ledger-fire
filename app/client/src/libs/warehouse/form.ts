import { fragment, signal } from "master-ts/core"
import { defineCustomTag, html } from "master-ts/extra"
import { tx } from "~/api/client"
import { commonSheet } from "~/styles"

const warehouseTag = defineCustomTag("x-warehouse-form")
export function WarehouseForm() {
    const host = warehouseTag()
    const dom = host.attachShadow({ mode: "open" })
    dom.adoptedStyleSheets.push(commonSheet)

    const name = signal("")
    const address = signal("")

    async function onSubmit() {
        await tx.createWarehouse({
            name: name.ref,
            address: address.ref,
        })
    }

    dom.append(
        fragment(html`
            <form on:submit=${(event) => (event.preventDefault(), onSubmit())}>
                <input type="text" placeholder="Name" bind:value=${name} />
                <input type="text" placeholder="Address" bind:value=${address} />
                <button type="submit">Create</button>
            </form>
        `),
    )

    return host
}
