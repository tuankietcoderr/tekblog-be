import { env } from "node:process"
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGODB_URI: string
            PORT: number
            JWT_SECRET: string
            SMTP_USER: string
            SMTP_USERNAME: string
            SMTP_PASSWORD: string
            URL: string
            ALLOWED_ORIGIN: string
        }
    }
}
