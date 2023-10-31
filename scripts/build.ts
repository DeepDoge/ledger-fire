import { mkdir, rm } from "fs/promises"
import { ScriptsConfig as BuildConfig } from "./config"

const output = await Bun.build({
    entrypoints: [BuildConfig.ts],
    minify: true,
    target: "browser",
}).then((output) => output.outputs[0]?.text())

if (!output) throw new Error("No output")

const html = await Bun.file(BuildConfig.html).text()
const newHtml = html.replace("<!-- js -->", () => `<script type="module">${output}</script>`)

await rm(BuildConfig.outDir, { recursive: true })
await mkdir(BuildConfig.outDir, { recursive: true })
await Bun.write(BuildConfig.out, newHtml)

console.log("Build complete")
console.log(`Output size: ${(output.length / 1024).toFixed(2)} KB`)
