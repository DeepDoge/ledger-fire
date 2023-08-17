import { $ } from "master-ts/library/$"
import type { SignalReadable } from "master-ts/library/signal"
import type { TemplateValue } from "master-ts/library/template"

export type DialogBase = {
	title: string
	message: string | ((close: () => void) => TemplateValue)
	resolve(value: boolean): void
}

export type DialogAlert = DialogBase & {
	type: "alert"
	confirm?: string
}

export type DialogConfirm = DialogBase & {
	type: "confirm"
	confirm?: string
	cancel?: string
}

export type DialogCustom = DialogBase & {
	type: "custom"
}

export type Dialog = DialogAlert | DialogConfirm | DialogCustom

export type DialogManager = {
	create<T extends Dialog>(init: Omit<T, "resolve">): Promise<Parameters<T["resolve"]>[0]>
	dialogs: SignalReadable<readonly Readonly<Dialog>[]>
}

export function createDialogManager(): DialogManager {
	const dialogs = $.writable<Dialog[]>([])

	const self: DialogManager = {
		create(init) {
			return new Promise((resolve) => {
				const dialog = {
					...init,
					resolve(...args: Parameters<typeof resolve>) {
						dialogs.ref = dialogs.ref.filter((item) => item !== dialog)
						resolve(...args)
					},
				} as Dialog

				dialogs.ref.push(dialog)
				dialogs.signal()
			})
		},
		dialogs,
	}

	return self
}
