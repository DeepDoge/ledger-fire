import { derive, populate } from "master-ts/core"
import { TYPEOF, css, defineCustomTag, html, match } from "master-ts/extra"
import { commonStyle } from "~/styles"
import type { DialogManager } from "./dialogManager"

const dialogTag = defineCustomTag("x-dialog")

export function DialogComponent({ dialogs }: DialogManager) {
	const host = dialogTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	const lastDialog = derive(() => (dialogs.ref.length > 0 ? dialogs.ref[dialogs.ref.length - 1]! : null))

	populate(dom, [
		match(lastDialog)
			.case(null, () => null)
			.default(
				(lastDialog) => html`
					<div class="overlay">
						<div class="backdrop"></div>
						<div class="dialog">
							<div class="title">${() => lastDialog.ref.title}</div>
							<div class="message">
								${match(lastDialog)
									.case({ message: { [TYPEOF]: "string" } }, (lastDialog) => html`${() => lastDialog.ref.message}`)
									.case({ message: { [TYPEOF]: "function" } }, (lastDialog) =>
										derive(() => lastDialog.ref.message(() => lastDialog.ref.resolve(false)), [lastDialog]),
									)
									.default()}
							</div>
							<div class="actions">
								${match(lastDialog)
									.case(
										{ type: "alert" },
										(lastDialog) => html`
											<button on:click=${() => lastDialog.ref.resolve()}>${() => lastDialog.ref.confirm ?? "OK"}</button>
										`,
									)
									.case(
										{ type: "confirm" },
										(lastDialog) => html`
											<button on:click=${() => lastDialog.ref.resolve(true)}>${() => lastDialog.ref.confirm ?? "OK"}</button>
											<button on:click=${() => lastDialog.ref.resolve(false)}>
												${() => lastDialog.ref.cancel ?? "Cancel"}
											</button>
										`,
									)
									.case({ type: "custom" }, () => html``)
									.default()}
							</div>
						</div>
					</div>
				`,
			),
	])

	return host
}

const style = css`
	:host {
		display: contents;
	}

	.overlay {
		isolation: isolate;
		position: fixed;
		inset: 0;
		padding-inline: calc(var(--span) * 0.5);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background-color: hsl(var(--background--hsl), 50%);
		z-index: -1;
	}

	.overlay {
		display: grid;
		align-content: end;
		justify-content: center;
		grid-template-columns: minmax(0, 25em);
	}

	.dialog {
		background-color: hsl(var(--base--hsl));
		color: hsl(var(--base-text--hsl));
		border-radius: var(--radius);
		box-shadow: 0 0 0.5em hsl(var(--base--hsl), 50%);
		padding: calc(var(--span) * 1);
	}

	.dialog {
		max-height: 90vh;
		display: grid;
		gap: calc(var(--span) * 0.5);
	}

	.message {
		overflow: auto;
	}
`
