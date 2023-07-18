export const API_PORT = 23450 as const
export const API_URL =
	typeof window !== "undefined" &&
	(location.hostname.endsWith("app.github.dev")
		? // NOTE: https://github.blog/changelog/2023-07-14-codespaces-port-forwarding-domain-name-updates/
		  (`https://deepdoge-redesigned-doodle-59gj7r54627p7j-${API_PORT}.preview.app.github.dev` as const)
		: (`${location.protocol}//${location.hostname}:${API_PORT}` as const))
