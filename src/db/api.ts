import { Database } from "."
import { mutators } from "./mutators"

const API_PORT = 23450 as const
const IS_SERVER = typeof window === "undefined"

if (IS_SERVER) Database.startServer(mutators, API_PORT)
export const db = IS_SERVER
	? (null as never)
	: Database.createClient(
			mutators,
			location.hostname.endsWith("app.github.dev")
				? `https://deepdoge-redesigned-doodle-59gj7r54627p7j-${API_PORT}.preview.app.github.dev`
				: `${location.protocol}//${location.hostname}:${API_PORT}`
	  )
