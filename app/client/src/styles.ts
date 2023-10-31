import { importAsset } from "@app/assets" assert { type: "macro" }

const globalCss = await importAsset("styles/global.css")
const rootCss = await importAsset("styles/root.css")

export const commonSheet = new CSSStyleSheet()
const rootSheet = new CSSStyleSheet()

await Promise.all([commonSheet.replace(globalCss), rootSheet.replace(rootCss)])

document.adoptedStyleSheets.push(rootSheet, commonSheet)
