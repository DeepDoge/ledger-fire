import { Bytes } from "@/utils/bytes"
import type { Prisma, Transaction } from "@prisma/client"
import { PrismaClient } from "@prisma/client"
import type Express from "express"
import { z } from "zod"

/* 

	If you are asking: 
	- "Why this big file exists and not separated into multiple files?" 
	- "Why do I import some stuff async and not at the top of the file?"
	
	Then the answer is: Blame ES6 modules, and lack of good namespace support with ES6 modules in TypeScript.
		Because without namespace support, I either separate this file into multiple files and then have to export internal stuff(create a mess)
		or I put everything in one file and then I don't have to export internal stuff.

	IDC if it doesn't tree shake, i dont wanna export internal stuff.

	Maybe later I will seperate createClient and startServer into their own files.
	So would client know stuff with something like that?
	I think startServer() might return needed stuff for client to work if we are not on server.

	Idk, maybe i have something like createDatabase() and it might have database.createClient() and database.startServer()
	And create database might dependency inject stuff into client and server.
*/

const MUTATION_PATH = "/db/mutate"
const QUERY_PATH = "/db/query"

export namespace Database {
	export type Mutator = {
		call: (tx: Transaction, db: Prisma.TransactionClient, params: any) => unknown
		scheme: z.ZodType<Record<PropertyKey, any>>
	}
	export type Mutators = Record<string, Mutator>
	export type MutationProxy<T extends Mutators> = {
		[K in keyof T]: (params: z.infer<T[K]["scheme"]>) => ReturnType<T[K]["call"]>
	}
	export function createMutator<TParams extends Mutator["scheme"], TReturns>(
		scheme: TParams,
		fn: (tx: Transaction, db: Prisma.TransactionClient, params: z.infer<TParams>) => TReturns
	) {
		return {
			call: fn,
			scheme,
		} satisfies Mutator
	}

	export type QueryProxy = {
		[K in Exclude<keyof PrismaClient, `$${string}` | symbol>]: {
			[K2 in AllowedPrismaMethodName]: PrismaClient[K][K2]
		}
	}

	export type Client<T extends Mutators> = {
		query: QueryProxy
		mutate: MutationProxy<T>
	}

	export function createClient<T extends Mutators>(apiUrl: string): Client<T> {
		return {
			query: createQueryProxy(apiUrl),
			mutate: createMutationProxy<T>(apiUrl),
		}
	}

	export async function startServer(port: number) {
		const express = await import("express").then((m) => m.default)
		const fs = await import("fs/promises").then((m) => m.default)
		const path = await import("path").then((m) => m.default)
		const colors = await import("colors/safe").then((m) => m.default)
		const { mutators }: { mutators: Mutators } = await import("./mutators")

		const LOG_PREFIX_TEXT = `[Indexer]` as const
		const LOG_PREFIX = colors.green(LOG_PREFIX_TEXT)
		const LOG_PREFIX_EMPTY = " ".repeat(LOG_PREFIX_TEXT.length)

		const prisma = new PrismaClient()
		const api = express()

		api.use(express.raw({ type: "application/octet-stream" }))
		handlePath(api, QUERY_PATH, async (data) => {
			const path = z.array(pathTokenScheme).parse(Bytes.decode(data))

			let current = prisma
			for (const token of path) {
				if (token.type === "property") accessCheck(path, token.prop)
				switch (token.type) {
					case "property":
						current = (current as any)[token.prop]
						break
					case "call":
						current = await (current as any)(...token.args)
						break
					default:
						throw new Error(`Unsupported token type ${(token as PathToken).type}`)
				}
			}

			return Bytes.encode(current)
		})

		let id: bigint
		try {
			id = BigInt(await fs.readFile("./transactions/id", "utf-8"))
		} catch {
			id = 0n
		}
		handlePath(api, MUTATION_PATH, async (request) => {
			const data = Bytes.decode(request)
			transactionRequestDataScheme(mutators).parse(data)

			// convert id to base64 and save the request bytes inside file, the path start from transactions/ folder and every letter is a folder except last letter if a file
			const pathToTx = path.join("./transactions", ...id.toString(36))
			await fs.mkdir(pathToTx, { recursive: true })
			await fs.writeFile(path.join(pathToTx, "tx"), request)

			// increment id and save it to file
			id++
			await fs.writeFile("./transactions/id", id.toString())

			return Bytes.encode(id)
		})

		api.listen(port, async () => {
			console.log()
			console.log(colors.bgGreen(" API Server "), colors.dim(`Listening on port`), colors.white(`${port}`))
			console.log()
			console.log(colors.green(" ➜ "), colors.white("Local:"), colors.cyan(`http://localhost:${port}`))
			console.log()
			startIndexer()
		})

		function applyHeaders(res: Express.Response) {
			res.header("Access-Control-Allow-Origin", "*")
			res.header("Access-Control-Allow-Methods", "POST")
			res.header("Access-Control-Allow-Headers", "Content-Type")
		}

		function handlePath(api: Express.Express, path: string, handler: (body: Uint8Array) => Promise<Uint8Array>) {
			api.options(path, (_, res) => {
				applyHeaders(res)
				res.send()
			})

			api.post(path, async (req, res) => {
				applyHeaders(res)

				try {
					res.send(Buffer.from(await handler(req.body)))
				} catch (error) {
					console.error(error)
					if (error instanceof Error) res.status(500).send(error.message)
					else res.status(500).send("Unknown error")
				}
			})
		}

		async function startIndexer() {
			console.log(LOG_PREFIX, "Indexer started")
			let indexedPreviousTx = true
			let nextTxId = (await prisma.indexing.findUnique({ where: { id: 0 } }))?.nextTxId ?? (await prisma.indexing.create({})).nextTxId
			while (true) {
				const indexedCurrentTx = await indexTx(nextTxId)
				if (indexedCurrentTx) {
					nextTxId = (
						await prisma.indexing.update({
							select: { nextTxId: true },
							where: { id: 0 },
							data: {
								nextTxId: {
									increment: 1n,
								},
							},
						})
					).nextTxId
				}
				if (indexedPreviousTx === indexedCurrentTx) continue
				indexedPreviousTx = indexedCurrentTx

				if (!indexedCurrentTx) {
					console.log(LOG_PREFIX, `Waiting for next transaction...`)
					console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`txId = ${nextTxId}`))
					await new Promise((resolve) => setTimeout(resolve, 500))
				}
			}
			console.log(LOG_PREFIX, "Indexer stopped")
		}

		async function indexTx(txId: bigint) {
			const txRequest = await fs.readFile(path.join("./transactions", ...txId.toString(36), "tx")).catch(() => null)
			if (!txRequest) return false

			try {
				await prisma.$transaction(async (prisma) => {
					const txRequestData = Bytes.decode(txRequest)
					const [methodName, params, from] = transactionRequestDataScheme(mutators).parse(txRequestData)

					const tx = await prisma.transaction.create({
						data: {
							id: txId,
							from: Buffer.from(from),
							timestamp: Date.now(),
						},
					})

					console.log(LOG_PREFIX, `Indexing transaction`)
					console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`txId = ${txId}`))
					console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`method = ${methodName}`))
					console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`from = ${from}`))

					const mutator = mutators[methodName]
					if (!mutator) throw new Error(`Unknown method ${methodName}`)

					await mutator.call(tx, prisma, params)
				})
			} catch (error) {
				console.log(LOG_PREFIX, colors.red(`Error while indexing transaction`))
				console.log(LOG_PREFIX_EMPTY, colors.gray("➜ "), colors.dim(`txId = ${txId}`))
				console.log(LOG_PREFIX_EMPTY, colors.red(`${error}`))
			}

			return true
		}
	}

	const pathTokenScheme = z.union([
		z.object({
			type: z.literal("property"),
			prop: z.string(),
		}),
		z.object({
			type: z.literal("call"),
			args: z.array(z.unknown()),
		}),
	])

	type PathToken = z.infer<typeof pathTokenScheme>

	function createQueryProxy(apiUrl: string): QueryProxy {
		function createProxy(path: PathToken[] = []): unknown {
			return new Proxy(() => {}, {
				get(_, prop) {
					accessCheck(path, prop)
					return createProxy([...path, { type: "property", prop }])
				},
				apply(_, __, args) {
					return callRemote([...path, { type: "call", args }])
				},
			})
		}

		async function callRemote(path: PathToken[]) {
			const response = await fetch(`${apiUrl}${QUERY_PATH}`, {
				method: "POST",
				body: Bytes.encode(path),
				headers: {
					"Content-Type": "application/octet-stream",
				},
			})

			if (!response.ok) throw new Error("Server error")
			const bytes = new Uint8Array(await response.arrayBuffer())
			return Bytes.decode(bytes)
		}

		return createProxy() as QueryProxy
	}

	function createMutationProxy<T extends Mutators>(apiUrl: string): MutationProxy<T> {
		return new Proxy(() => {}, {
			get(_: never, methodKey: string) {
				return async (params: unknown) => {
					const requestData: TransactionRequestData = [methodKey, params, new Uint8Array(0)]
					await fetch(`${apiUrl}${MUTATION_PATH}`, {
						method: "POST",
						body: Bytes.encode(requestData),
						headers: {
							"Content-Type": "application/octet-stream",
						},
					})
				}
			},
		}) as unknown as MutationProxy<T>
	}

	const allowedPrismaMethodNames = [
		"findUnique",
		"findUniqueOrThrow",
		"findFirst",
		"findFirstOrThrow",
		"findMany",
	] as const satisfies PrismaMethodName
	type AllowedPrismaMethodName = (typeof allowedPrismaMethodNames)[number]

	type PrismaMethodName = readonly Exclude<
		{
			[K in Exclude<keyof PrismaClient, `$${string}` | symbol>]: keyof PrismaClient[K]
		}[Exclude<keyof PrismaClient, `$${string}` | symbol>],
		symbol
	>[]

	const allowedPrismaMethodNamesSet = new Set(allowedPrismaMethodNames)
	function accessCheck(path: PathToken[], prop: unknown): asserts prop is string {
		if (typeof prop !== "string") throw new Error("Not Allowed")
		if (path.length === 0 && prop.startsWith("$")) throw new Error("Not Allowed")
		if (path.length === 1 && !allowedPrismaMethodNamesSet.has(prop)) throw new Error("Not Allowed")
	}

	const transactionRequestDataScheme = (mutators: Mutators) =>
		z.tuple([z.enum(Object.keys(mutators) as [string, ...string[]]), z.unknown(), z.instanceof(Uint8Array)])
	type TransactionRequestData = z.infer<ReturnType<typeof transactionRequestDataScheme>>
}
