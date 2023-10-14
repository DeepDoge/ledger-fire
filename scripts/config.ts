import path from "path"

export namespace ScriptsConfig {
	export const root = path.resolve(path.join(import.meta.dir, ".."))
	export const distDirname = path.join(root, "dist")
	export const srcDirname = path.join(root, "src")

	export const html = path.join(root, "index.html")
	export const ts = path.join(srcDirname, "app.ts")
	export const dist = path.join(distDirname, "index.html")
}
