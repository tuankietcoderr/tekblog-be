import { Request, Response, Router } from "express"
import { sendMail } from "../service/mailer"
import bcrypt from "bcryptjs"
import User from "../schema/User"
import verifyToken from "../middleware/auth"

const router = Router()

router.post("/email/send", verifyToken, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user_id)
        if (!user) return res.status(400).json({ success: false, message: "User not found" })
        if (user.isEmailVerified) {
            return res.status(400).json({ success: false, message: "Email already verified" })
        }
        const email = user.email
        const hashedToken = await bcrypt.hash(email as string, 10)
        sendMail({
            to: email as string,
            subject: "Verify email for TekBlog account",
            text: `Dear ${user.name},\n\nPlease confirm your email via this link: \n\n${process.env.URL}/email?email=${email}&token=${hashedToken}\n\nRegards,\nTekBlog Team`
        })
            .catch((err) => {
                return res.status(500).json({ success: false, message: err.message })
            })
            .then(() => {
                res.status(200).json({ success: true, message: "Email sent" })
            })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.get("/email", async (req: Request, res: Response) => {
    try {
        const { email, token } = req.query
        const isMatch = await bcrypt.compare(email as string, token as string)
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Unable to verify email. Please try again or contact us for support"
            })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ success: false, message: "User doesn't exist" })
        }

        user.isEmailVerified = true
        await user.save()

        res.render("email-verified", { email })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
