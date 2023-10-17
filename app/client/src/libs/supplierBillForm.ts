import { fragment, signal } from "master-ts/core"
import { defineCustomTag, html } from "master-ts/extra"
import { tx } from "~/api/client"
import { commonStyle } from "~/styles"

const supplierBillFormTag = defineCustomTag("x-supplier-bill-form")
export function SupplierBillFormComponent() {
	/* 
		TODO:
		You should first select a supplier, selecting a supplier screen should also let you create a new supplier.
		Then fill product code, or name
		if product code exists it will use the existing product and fill name field automatically
		if code doesnt exists, it will ask you to enter a name
		then other stuff etc.

		then you send the bill creation as a transaction
		then indexer runs the method and links or creates products to the bill for the supplier
		then someone with enough privilage at that time, can verify or edit the supplier bill
		and it wont verify if it has remote supplier products that are not matched/linked with our local products
		so you can link or create the local prodcut and verify the bill
		and it will actually execute the stocks changes and also generate the buying bill for your half automatically
		then it will connect the goverment's api to create an e-belge for it and done.

		anyway form ui is simple it has two screens, it let's you select a supplier
		then wants you to enter a product code, or leave it empty if it doesnt exists
		if you enter product code and if it exists just ask you for the quantity
		if you enter product code and it doesnt exists, it ask you for a name and quantity
		if you leave product code empty it ask you for a name, and also searches for existing product names so you can select one or create a new one etc
		it should be simple and shouldnt require any mouse use.
	*/

	const host = supplierBillFormTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle)

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
