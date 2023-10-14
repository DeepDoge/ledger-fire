import path from "path"

export namespace ScriptsConfig {
	export const root = path.resolve(".")

	export const clientDir = path.join(root, "packages", "client")
	export const html = path.join(clientDir, "index.html")
	export const ts = path.join(clientDir, "src", "app.ts")

	export const outDir = path.join(root, "out")
	export const out = path.join(outDir, "index.html")
}
