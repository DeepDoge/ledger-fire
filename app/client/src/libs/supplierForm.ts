import { fragment, signal } from "master-ts/core"
import { defineCustomTag, html } from "master-ts/extra"
import { tx } from "~/api/client"
import { commonSheet } from "~/styles"

const supplierFormTag = defineCustomTag("x-supplier-form")
export function SupplierFormComponent() {
    const host = supplierFormTag()
    const dom = host.attachShadow({ mode: "open" })
    dom.adoptedStyleSheets.push(commonSheet)

    const name = signal("")
    const address = signal("")
    const phone = signal("")
    const email = signal("")
    const taxNumber = signal("")

    async function onSubmit() {
        await tx.createSupplierAccount({
            name: name.ref,
            address: address.ref,
            email: email.ref,
            phone: phone.ref,
            taxNumber: taxNumber.ref,
        })
    }

    dom.append(
        fragment(html`
            <form on:submit=${(event) => (event.preventDefault(), onSubmit())}>
                <input type="text" placeholder="Full Name" bind:value=${name} />
                <input type="text" placeholder="Address" bind:value=${address} />

                <button type="submit">Create</button>
            </form>
        `),
    )

    return host
}
