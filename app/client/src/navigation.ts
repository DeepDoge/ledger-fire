import { fragment } from "master-ts/core"
import { css, defineCustomTag, html } from "master-ts/extra"
import { routeHash } from "~/router"
import { commonSheet } from "~/styles"

const navigationTag = defineCustomTag("x-navigation")

export function NavigationComponent() {
    const host = navigationTag()
    const dom = host.attachShadow({ mode: "open" })
    dom.adoptedStyleSheets.push(commonSheet, sheet)

    dom.append(
        fragment(html`
            <nav>
                <a href=${routeHash({ path: "warehouses" })}>Warehouses</a>
                <a href=${routeHash({ path: "products" })}>Products</a>
            </nav>
        `),
    )

    return host
}

const sheet = css`
    :host {
        display: contents;
    }

    nav {
        display: grid;
        gap: calc(var(--span) * 0.25);
        padding: calc(var(--span) * 0.5);
        align-content: start;

        background-color: hsl(var(--base--hsl));
    }

    nav > * {
        background-color: hsl(var(--background--hsl));
        color: hsl(var(--background-text--hsl));
        padding: calc(var(--span) * 0.5);
        border-radius: var(--radius);
    }
`.toSheet()
