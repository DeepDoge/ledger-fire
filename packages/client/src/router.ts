import { Signal, derive, signal } from "master-ts/core"

const routePath = signal("")
const routePathArr = derive(() => routePath.ref.split("/"))
const route = {
	path: routePath,
	pathArr: routePathArr,
}
const routeReadable = route as {
	[K in keyof typeof route]: (typeof route)[K] extends Signal.Mut<infer U> ? Signal<U> : (typeof route)[K]
}
export { routeReadable as route }
function updateRoute() {
	const path = location.hash
	routePath.ref = path ?? ""
}
updateRoute()
window.addEventListener("hashchange", updateRoute)
setInterval(updateRoute, 100)

export function routeHash({ path }: { path?: string }): string {
	if (path === undefined) path = routePath.ref

	return `#${path}`
}
