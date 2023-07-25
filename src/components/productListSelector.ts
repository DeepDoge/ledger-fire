import { defineComponent } from "master-ts/library/component"
import { html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-product-list-selector")

function ProductListSelectorComponent() {
	const component = new ComponentConstructor()

	component.$html = html`
		<div class="item">
			<div class="image">
				<img src="https://via.placeholder.com/150" alt="Product Image" />
			</div>
			<div class="content">
				<div class="header">Product Name</div>
				<div class="meta">
					<span class="price">$XX.XX</span>
					<span class="stay">XX in stock</span>
				</div>
				<div class="description">Product Description</div>
			</div>
		</div>
	`

	return component
}
