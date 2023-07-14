import express from "express"

const api = express()

api.get("/", (req, res) => {
    req
	res.send("Hello World")
})

api.listen(3000, () => {
	console.log("Server is running on port 3000")
})
