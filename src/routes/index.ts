import { Express } from "express"
import authRouter from "./auth"
import userRouter from "./user"
import verifyRouter from "./verify"
import postRouter from "./post"
import tagRouter from "./tag"
import reportRouter from "./report"
import adminRouter from "./admin"
import commentRouter from "./comment"
import searchRouter from "./search"

function getRoutes(app: Express) {
    app.use("/api/auth", authRouter)
    app.use("/api/user", userRouter)
    app.use("/api/verify", verifyRouter)
    app.use("/api/post", postRouter)
    app.use("/api/tag", tagRouter)
    app.use("/api/report", reportRouter)
    app.use("/api/admin", adminRouter)
    app.use("/api/comment", commentRouter)
    app.use("/api/search", searchRouter)
}

export default getRoutes
