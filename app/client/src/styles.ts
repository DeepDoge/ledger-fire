import { importAsset } from "@app/assets" assert { type: "macro" }

const globalCss = await importAsset("styles/global.css")
const rootCss = await importAsset("styles/root.css")

export const commonStyle = new CSSStyleSheet()
const rootStyle = new CSSStyleSheet()

await Promise.all([commonStyle.replace(globalCss), rootStyle.replace(rootCss)])

document.adoptedStyleSheets.push(rootStyle, commonStyle)
