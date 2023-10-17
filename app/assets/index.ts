import path from "path"

export async function importAsset(name: string): Promise<string> {
	const filepath = path.join(import.meta.dir, name)
	const css = await Bun.file(filepath).text()
	return css
}
