import express, { type Application, type Request, type Response } from "express"

const app : Application = express()
const port = 8000

// Root directory
app.get('/', (req: Request, res: Response) => {
  // res.send('Hello World!')
  res.status(200).json({
    "success": true,
    "message": "DevPulse Server Running",
    "author": "Ruhul Amin"
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})