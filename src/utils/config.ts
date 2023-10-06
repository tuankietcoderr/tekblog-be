import { configDotenv } from "dotenv"
import cors from "cors"
import morgan from "morgan"

function config(express: any) {
    const app = express()
    configDotenv()
    const allowOrigins = process.env.ALLOWED_ORIGIN?.trim()?.split(",") || "*"
    app.use(
        cors({
            origin: allowOrigins,
            exposedHeaders: "content-length",
            credentials: true,
            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "Origin",
                "X-Requested-With",
                "Accept",
                "Accept-Encoding",
                "Accept-Language",
                "Host",
                "Referer",
                "User-Agent",
                "X-CSRF-Token"
            ],
            maxAge: 86400,
            preflightContinue: false,
            optionsSuccessStatus: 204
        })
    )

    app.use(morgan("dev"))
    app.use(express.urlencoded({ extended: true, limit: "50mb" }))

    app.use(express.json({ limit: "50mb" }))
    app.set("view engine", "ejs")
    return app
}

function run(app: any) {
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`))
}

export { config, run }
