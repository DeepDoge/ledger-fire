/* 
	TODO: Make this hot-reload.
*/
import { ApiServer } from "@app/server"
import path from "path"
import { ScriptsConfig } from "./config"

const outDir = `/tmp/${Math.random().toString(36).slice(2)}_bun_dev`
const outJs = path.join(outDir, `${path.basename(ScriptsConfig.ts, path.extname(ScriptsConfig.ts))}.js`)

Bun.spawn(["bun", "build", "--watch", ScriptsConfig.ts, "--target", "browser", "--outdir", outDir], {
    stdout: "inherit",
    stderr: "inherit",
})

Bun.serve({
    development: true,
    async fetch(request) {
        const url = new URL(request.url)

        if (url.pathname.startsWith("/api")) return await api.handle(request)

        const output = await Bun.file(outJs).text()
        return new Response(
            await Bun.file(ScriptsConfig.html)
                .text()
                .then((html) => html.replace("<!-- js -->", () => `<script type="module">${output}</script>`)),
            {
                headers: { "Content-Type": "text/html" },
            },
        )
    },
})

const api = await ApiServer.start()

process.on("SIGINT", process.exit)
