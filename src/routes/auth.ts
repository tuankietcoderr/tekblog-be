import bcrypt from "bcryptjs"
import express, { Request, Response } from "express"
import jwt from "jsonwebtoken"
import IUser from "../interface/IUser"
import Credential from "../schema/Credential"
import User from "../schema/User"
import doNotAllowFields from "../middleware/not-allow-field"
import mustHaveFields from "../middleware/must-have-field"

const router = express.Router()

router.post(
    "/signup",
    doNotAllowFields<IUser>(
        "activeStatus",
        "followers",
        "following",
        "isEmailVerified",
        "role",
        "savedPosts",
        "likedPosts"
    ),
    mustHaveFields<IUser>("username", "password", "name", "email", "major"),
    async (req: Request, res: Response) => {
        const { username, password } = req.body
        try {
            const user = await User.findOne({ username })
            if (user) return res.status(400).json({ success: false, message: "User already exists" })

            const newUser = new User({
                ...req.body
            })
            await newUser.save()
            const bcryptPassword = await bcrypt.hash(password, 10)
            const newCredential = new Credential({
                user_id: newUser._id,
                password: bcryptPassword
            })
            await newCredential.save()

            const accessToken = jwt.sign({ user_id: newUser._id.toString() }, process.env.JWT_SECRET!, {
                expiresIn: "1y"
            })
            res.json({
                success: true,
                message: "User created",
                accessToken,
                data: newUser
            })
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message })
        }
    }
)

router.post("/signin", mustHaveFields<IUser>("username", "password"), async (req, res) => {
    const { username, password } = req.body
    try {
        const user = await User.findOne({ username })
        if (!user) return res.status(400).json({ success: false, message: "User does not exist" })

        const credential = await Credential.findOne({
            user_id: user._id
        })

        if (!credential) {
            return res.status(400).json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, credential.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Wrong password" })
        }

        const accessToken = jwt.sign({ user_id: user._id.toString() }, process.env.JWT_SECRET!, { expiresIn: "1y" })
        res.json({
            success: true,
            message: "User logged in",
            accessToken,
            data: user
        })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
