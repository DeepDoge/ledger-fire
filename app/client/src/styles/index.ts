import path from "path"

export async function importCss(name: string) {
	const filepath = path.join(import.meta.dir, name)
	const css = await Bun.file(filepath).text()
	return css
}
