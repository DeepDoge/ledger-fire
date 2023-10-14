import { Signal, TagsNS, signal } from "master-ts/core"

export type DialogBase = {
	title: string
}

export type DialogAlert = DialogBase & {
	type: "alert"
	message: string
	confirm?: string
	resolve(): void
}

export type DialogConfirm = DialogBase & {
	type: "confirm"
	message: string
	confirm?: string
	cancel?: string
	resolve(value: boolean): void
}

export type DialogCustom = DialogBase & {
	type: "custom"
	message(close: () => void): TagsNS.AcceptedChild
	resolve(): void
}

export type Dialog = DialogAlert | DialogConfirm | DialogCustom

export type DialogManager = {
	create<T extends Dialog>(init: Omit<T, "resolve">): Promise<Parameters<T["resolve"]>[0]>
	dialogs: Signal<readonly Readonly<Dialog>[]>
}

export function createDialogManager(): DialogManager {
	const dialogs = signal<Dialog[]>([])

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
				dialogs.ping()
			})
		},
		dialogs,
	}

	return self
}
