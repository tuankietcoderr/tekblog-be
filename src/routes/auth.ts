import bcrypt from "bcryptjs"
import express, { Request, Response } from "express"
import jwt from "jsonwebtoken"
import IUser from "../interface/IUser"
import Credential from "../schema/Credential"
import User from "../schema/User"
import doNotAllowFields from "../middleware/not-allow-field"
import mustHaveFields from "../middleware/must-have-field"
import { sendMail } from "../service/mailer"

const router = express.Router()

router.post(
    "/signup",
    doNotAllowFields<IUser>("activeStatus", "followers", "following", "isEmailVerified", "role"),
    mustHaveFields<IUser>("username", "password", "name", "email"),
    async (req: Request, res: Response) => {
        const { username, password, email } = req.body
        try {
            const user = await User.findOne({ $or: [{ username }, { email }] })
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

router.post("/signin", mustHaveFields("usernameOrEmail", "password"), async (req, res) => {
    const { usernameOrEmail, password } = req.body
    try {
        const user = await User.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] })
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

// FORGET PASSWORD
router.get("/forgot-password", async (req, res) => {
    try {
        const { usernameOrEmail } = req.query

        const user = await User.findOne({
            $or: [
                {
                    username: usernameOrEmail
                },
                {
                    email: usernameOrEmail
                }
            ]
        })
        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" })
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({ success: false, message: "Email is not verified" })
        }

        const credential = await Credential.findOne({ user_id: user._id })
        if (!credential) {
            return res.status(400).json({ success: false, message: "User does not exist" })
        }
        const randomPassword = Math.random().toString(36).slice(-8)

        const hashedPassword = await bcrypt.hash(randomPassword, 10)
        credential.password = hashedPassword

        await credential.save()

        sendMail({
            to: user.email as string,
            subject: "Reset password for TekBlog account",
            html: `Dear ${user.name},<br/>This is your reset password: <b>${randomPassword}</b>. Use this password to login and change it as you want in the profile!<br/>Regards,<br/>TekBlog Team`
        })
            .then(() => {
                return res.status(200).json({ success: true, message: "Email sent" })
            })
            .catch((err: any) => {
                return res.status(500).json({ success: false, message: err.message })
            })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" })
    }
})

export default router
