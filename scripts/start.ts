import { ApiServer } from "@/api/server"
import "./build"
import { ScriptsConfig } from "./config"

const buffer = await Bun.file(ScriptsConfig.dist).arrayBuffer()
const api = await ApiServer.start()

Bun.serve({
	async fetch(request) {
		const url = new URL(request.url)

		if (url.pathname.startsWith("/api")) return await api.handle(request)
		return new Response(buffer, { headers: { "Content-Type": "text/html" } })
	},
})
