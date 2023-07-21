import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import type { SignalReadable } from "master-ts/library/signal"
import { css, html } from "master-ts/library/template"

const ComponentConstructor = defineComponent("x-dialog")

export type DialogBase = {
	id: unknown
	title: string
	message: string
}

export type DialogAlert = DialogBase & {
	type: "alert"
	confirm?: string
	resolver: () => void
}

export type DialogConfirm = DialogBase & {
	type: "confirm"
	confirm?: string
	cancel?: string
	resolver: (value: boolean) => void
}

export type Dialog = DialogAlert | DialogConfirm

export type DialogManager = {
	create<T extends Dialog>(init: Omit<T, "resolver" | "id">): Promise<ReturnType<T["resolver"]>>
	component: ReturnType<typeof DialogComponent>
}

export function createDialogManager(): DialogManager {
	const dialogs = $.writable<Dialog[]>([])

	const self: DialogManager = {
		create(init) {
			return new Promise((resolve) => {
				const dialog = {
					id: Symbol(),
					...init,
					resolver(...args: Parameters<typeof resolve>) {
						dialogs.ref = dialogs.ref.filter((dialog) => dialog.id !== dialog.id)
						resolve(...args)
					},
				} as unknown as Dialog

				dialogs.ref.push(dialog)
				dialogs.signal()
			})
		},
		component: DialogComponent(dialogs),
	}

	return self
}

function DialogComponent(dialogs: SignalReadable<Dialog[]>) {
	const component = new ComponentConstructor()

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
							<div class="message">${() => lastDialog.ref.message}</div>
							${() => {
								switch (lastDialog.ref.type) {
									case "alert": {
										const dialog = lastDialog.ref
										return html`
											<div class="actions">
												<button on:click=${() => dialog.resolver()}>${() => dialog.confirm ?? "OK"}</button>
											</div>
										`
									}
									case "confirm": {
										const dialog = lastDialog.ref
										return html`
											<div class="actions">
												<button on:click=${() => dialog.resolver(true)}>${() => dialog.confirm ?? "OK"}</button>
												<button on:click=${() => dialog.resolver(false)}>${() => dialog.cancel ?? "Cancel"}</button>
											</div>
										`
									}
								}
							}}
						</div>
					</div>
				`
			)}
	`

	return component
}

ComponentConstructor.$css = css`
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
