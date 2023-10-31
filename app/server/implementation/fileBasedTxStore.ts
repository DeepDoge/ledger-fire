import { Database } from "@app/common/database"
import { Bytes } from "@app/common/utils/bytes"
import fs from "fs/promises"
import path from "path"

export type FileBasedTxStore = Database.TxStore & {}
export namespace FileBasedTxStore {
    export async function create({ dirname }: { dirname: string }): Promise<FileBasedTxStore> {
        dirname = path.resolve(dirname)
        const idFilename = path.join(dirname, "id")

        let nextId = await fs
            .readFile(idFilename)
            .then((data) => BigInt(data.toString("utf-8")))
            .catch(() => BigInt(0))

        return {
            async add({ txRequest }) {
                const tx: Database.Tx = {
                    ...txRequest,
                    id: nextId,
                    timestamp: Date.now(),
                }

                const txIdHex = tx.id.toString(16).padStart(16, "0")
                const txFilename = path.join(dirname, ...txIdHex, "tx")
                await fs.mkdir(path.dirname(txFilename), { recursive: true })
                await fs.writeFile(txFilename, Bytes.encode(tx))

                nextId++
                await fs.writeFile(idFilename, nextId.toString())

                return tx
            },
            async get({ id }) {
                const txIdHex = id.toString(16).padStart(16, "0")
                const txFilename = path.join(dirname, ...txIdHex, "tx")
                const tx = await fs
                    .readFile(txFilename)
                    .then((data) => Database.Tx.Parser.parse(Bytes.decode(data)))
                    .catch(() => null)

                return tx
            },
        }
    }
}
