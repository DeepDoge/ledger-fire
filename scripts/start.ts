import { ApiServer } from "@app/server"
import { ScriptsConfig } from "./config"

import "./build"
const buffer = await Bun.file(ScriptsConfig.out).arrayBuffer()
Bun.serve({
	async fetch(request) {
		const url = new URL(request.url)

		if (url.pathname.startsWith("/api")) return await api.handle(request)
		return new Response(buffer, { headers: { "Content-Type": "text/html" } })
	},
})

const api = await ApiServer.start()

process.on("SIGINT", process.exit)
