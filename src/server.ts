import getRoutes from "./routes"
import express from "express"
import { config, run } from "./utils/config"
import { connectDB } from "./utils/db"

connectDB()

const app = config(express)
getRoutes(app)
run(app)
