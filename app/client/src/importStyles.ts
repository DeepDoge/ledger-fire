import { importCss } from "./styles" assert { type: "macro" }

const globalCss = await importCss("global.css")
const rootCss = await importCss("root.css")

export const commonStyle = new CSSStyleSheet()
const rootStyle = new CSSStyleSheet()

await Promise.all([commonStyle.replace(globalCss), rootStyle.replace(rootCss)])

document.adoptedStyleSheets.push(rootStyle, commonStyle)
