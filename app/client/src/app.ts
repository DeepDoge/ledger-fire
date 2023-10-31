import "~/styles"

import { Template, fragment, signal } from "master-ts/core"
import { css, defineCustomTag, html } from "master-ts/extra"
import { ProductList } from "~/libs/product/list"
import { WarehouseList } from "~/libs/warehouse/list"
import { NavigationComponent } from "~/navigation"
import { route } from "~/router"
import { commonSheet } from "~/styles"

export namespace App {
    export const language = signal(navigator.language)
    language.follow((lang) => (document.documentElement.lang = lang), { mode: "immediate" })

    const appTag = defineCustomTag("x-app")
    function AppComponent() {
        const host = appTag()
        const dom = host.attachShadow({ mode: "open" })
        dom.adoptedStyleSheets.push(commonSheet, sheet)

        const routeView = signal<Template.Member>(
            null!,
            (set) =>
                route.pathArr.follow(
                    (pathArr) => {
                        if (pathArr[0] === "#warehouses") {
                            set(html`
                                <h1>Warehouses</h1>
                                ${WarehouseList()}
                            `)
                        } else if (pathArr[0] === "#products") {
                            set(html`
                                <h1>Products</h1>
                                ${ProductList()}
                            `)
                        } else {
                            set(null)
                        }
                    },
                    { mode: "immediate" },
                ).unfollow,
        )

        dom.append(
            fragment(html`
                <header style:grid-area=${"header"}>
                    <x ${NavigationComponent()}></x>
                </header>
                <main style:grid-area=${"main"}>${routeView}</main>
            `),
        )

        return host
    }

    const sheet = css`
        :host {
            display: grid;
            grid-template-areas: "header main";
            grid-template-columns: minmax(0, 10em) 1fr;
        }

        header {
            display: grid;

            position: sticky;
            top: 0;
            height: 100vh;
        }

        main {
            display: grid;
            align-content: start;
            gap: calc(var(--span) * 1);
            padding: calc(var(--span) * 2);
        }
    `.toSheet()

    document.body.append(AppComponent())
}
