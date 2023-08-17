import { $ } from "master-ts/library/$"
import type { SignalReadable } from "master-ts/library/signal"
import { css, html } from "master-ts/library/template"
import { assert } from "master-ts/library/utils/assert"
import type { DialogManager } from "./dialogManager"

const Component = $.component("x-dialog")

export function DialogComponent({ dialogs }: DialogManager) {
	const component = new Component()

	const lastDialog = $.derive(() => (dialogs.ref.length > 0 ? dialogs.ref[dialogs.ref.length - 1]! : null))

	component.$html = html`
		${$.match(lastDialog)
			.case(null, () => null)
			.default(
				(lastDialog) => html`
					<div class="overlay">
						<div class="backdrop"></div>
						<div class="dialog">
							<div class="title">${() => lastDialog.ref.title}</div>
							<div class="message">
								${$.derive(() => {
									switch (typeof lastDialog.ref.message) {
										case "string":
											assert<SignalReadable<{ message: string }>>(lastDialog)
											return html`${() => lastDialog.ref.message}`
										case "function":
											assert<SignalReadable<{ message(...args: any[]): any }>>(lastDialog)
											return html` ${$.derive(() => lastDialog.ref.message(lastDialog.ref.resolve), [lastDialog])} `
									}
								}, [$.derive(() => typeof lastDialog.ref.message)])}
							</div>
							<div class="actions">
								${$.derive(() => {
									switch (lastDialog.ref.type) {
										case "alert":
											assert<SignalReadable<{ type: typeof lastDialog.ref.type }>>(lastDialog)
											return html` <button on:click=${() => lastDialog.ref.resolve()}>${() => lastDialog.ref.confirm ?? "OK"}</button> `
										case "confirm":
											assert<SignalReadable<{ type: typeof lastDialog.ref.type }>>(lastDialog)
											return html`
												<button on:click=${() => lastDialog.ref.resolve(true)}>${() => lastDialog.ref.confirm ?? "OK"}</button>
												<button on:click=${() => lastDialog.ref.resolve(false)}>${() => lastDialog.ref.cancel ?? "Cancel"}</button>
											`
										case "custom":
											assert<SignalReadable<{ type: typeof lastDialog.ref.type }>>(lastDialog)
											return null
									}
									lastDialog.ref satisfies never
								}, [$.derive(() => lastDialog.ref.type)])}
							</div>
						</div>
					</div>
				`
			)}
	`

	return component
}

Component.$css = css`
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
