import { Configs, Database, Utils, type mutations } from "@app/common"
import type { Prisma } from "@prisma/client"
import { App } from "~/app"

function createProxy(fn: (path: readonly string[], args: unknown[]) => Promise<unknown>) {
    function getter(path: readonly string[]): object {
        return new Proxy(() => {}, {
            get(_, key) {
                return getter([...path, String(key)])
            },
            apply(_, __, args: unknown[]) {
                return fn(path, args)
            },
        })
    }
    return getter([])
}

export const query = createProxy(async ([table, ...path], args) => {
    if (!table) throw new Error("Invalid path")

    const response = await fetch(Configs.Api.QUERY_PATH, {
        method: "POST",
        body: Utils.Bytes.encode(
            Database.QueryRequest.Parser.parse({
                table,
                path,
                args,
            } satisfies Database.QueryRequest),
        ),
        headers: {
            "Content-Type": "application/octet-stream",
        },
    })
    if (!response.ok) throw new Error("Query failed")

    return Utils.Bytes.decode(new Uint8Array(await response.arrayBuffer()))
}) as Pick<Prisma.TransactionClient, Exclude<keyof Prisma.TransactionClient, `$${string}` | Exclude<PropertyKey, string>>>

export const tx = createProxy(async (path, [params]) => {
    if (path.length !== 1) throw new Error("Invalid path")
    const [name] = path
    if (!name) throw new Error("Invalid path")

    const response = await fetch(Configs.Api.TX_PATH, {
        method: "POST",
        body: Utils.Bytes.encode(
            Database.TxRequest.Parser.parse({
                from: new Uint8Array([0]),
                language: App.language.ref,
                mutation: {
                    name,
                    params,
                },
            } satisfies Database.TxRequest),
        ),
        headers: {
            "Content-Type": "application/octet-stream",
        },
    })
    if (!response.ok) throw new Error("Transaction failed")

    return Utils.Bytes.decode(new Uint8Array(await response.arrayBuffer()))
}) as {
    [key in keyof typeof mutations]: (
        args: Database.TxMutation.InferParameters<(typeof mutations)[key]>,
    ) => Promise<Database.TxMutation.InferReturnType<(typeof mutations)[key]>>
}
