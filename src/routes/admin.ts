import { Request, Response, Router } from "express"
import { Types } from "mongoose"
import verifyAdmin from "../middleware/admin"
import Report from "../schema/Report"
import ObjectType from "../common/object-type"
import User from "../schema/User"
import ActiveStatus from "../common/active-status"
import Post from "../schema/Post"
import { sendMail } from "../service/mailer"
import mustHaveFields from "../middleware/must-have-field"
import IUser, { EUserRole } from "../interface/IUser"
import bcrypt from "bcryptjs"
import Credential from "../schema/Credential"
import jwt from "jsonwebtoken"

const router = Router()
const toId = Types.ObjectId

router.post("/account", mustHaveFields("secret_key", "username", "email", "password", "name"), async (req, res) => {
    const { secret_key, username, email, password, name } = req.body
    try {
        if (secret_key !== process.env.SECRET_ADMIN_KEY)
            return res.status(400).json({ success: false, message: "Invalid secret key" })
        const user = await User.findOne({ $or: [{ username }, { email }] })
        if (user) return res.status(400).json({ success: false, message: "User already exists" })

        const newUser = new User({
            username,
            email,
            name,
            role: EUserRole.ADMIN
        })
        await newUser.save()
        const bcryptPassword = await bcrypt.hash(password, 10)
        const newCredential = new Credential({
            user_id: newUser._id,
            password: bcryptPassword
        })
        await newCredential.save()

        const accessToken = jwt.sign({ user_id: newUser._id.toString() }, process.env.JWT_SECRET!, {
            expiresIn: "1d"
        })
        res.json({
            success: true,
            message: "Admin created",
            accessToken,
            data: newUser
        })
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message })
    }
})

router.get("/report", verifyAdmin, async (req: Request, res: Response) => {
    try {
        const reports = await Report.find({})
            .populate("reporter", "username name avatar")
            .populate("object", "title content avatar username name author")
        res.json({ success: true, data: reports })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.get("/report/:id", verifyAdmin, async (req: Request, res: Response) => {
    try {
        const report = await Report.findById(new toId(req.params.id))
            .populate("reporter", "username name avatar")
            .populate("object", "title avatar username name")
        if (!report) return res.status(404).json({ success: false, message: "Report not found" })
        res.json({ success: true, data: report })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.put("/block/user", verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { user_id } = req.query
        if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" })
        const user = await User.findById(new toId(user_id.toString()))
        if (!user) return res.status(404).json({ success: false, message: "User not found" })
        user.activeStatus = user.activeStatus === ActiveStatus.ACTIVE ? ActiveStatus.BLOCKED : ActiveStatus.ACTIVE
        const blockedUser = await user.save()
        res.json({ success: true, data: blockedUser })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.put("/block/post", verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { post_id } = req.query
        if (!post_id) return res.status(400).json({ success: false, message: "Missing post_id" })
        const post = await Post.findById(new toId(post_id.toString()))
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        post.activeStatus = post.activeStatus === ActiveStatus.ACTIVE ? ActiveStatus.BLOCKED : ActiveStatus.ACTIVE
        const blockedPost = await post.save()
        res.json({ success: true, data: blockedPost })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.put("/remove/user", verifyAdmin, mustHaveFields("reason"), async (req: Request, res: Response) => {
    try {
        const { user_id } = req.query
        const { reason } = req.body
        if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" })
        const user = await User.findById(new toId(user_id.toString()))
        if (!user) return res.status(404).json({ success: false, message: "User not found" })
        if (user.activeStatus === ActiveStatus.REMOVED)
            return res.status(400).json({ success: false, message: "User is already removed" })
        user.updateOne(
            {
                $set: {
                    activeStatus: ActiveStatus.REMOVED
                }
            },
            { new: true }
        )
            .then(() => {
                sendMail({
                    to: user.email,
                    subject: "TekBlog - Your account has been deleted by admin",
                    html: `
                        <h1>Your account has been deleted by admin</h1>
                        <p>Reason: ${reason}</p>
                        <p>Please contact us by email for getting your account back!
                        <br/>Thank you!</p>
                        <p>Regards,
                        <br/>TekBlog Team.</p>
                    `
                })
                    .then(() => {
                        return res.json({ success: true, data: user, message: "Success" })
                    })
                    .catch(() => {
                        return res.status(500).json({ success: false, message: "Send mail failed" })
                    })
            })
            .catch(() => {
                return res.status(500).json({ success: false, message: "Delete user failed" })
            })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.put("/remove/post", verifyAdmin, mustHaveFields("reason"), async (req: Request, res: Response) => {
    try {
        const { post_id } = req.query
        const { reason } = req.body
        if (!post_id) return res.status(400).json({ success: false, message: "Missing post_id" })
        const post = await Post.findById(new toId(post_id.toString())).populate("author", "email")
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        if (post.activeStatus === ActiveStatus.REMOVED)
            return res.status(400).json({ success: false, message: "Post is already removed" })
        const author = post?.author as IUser
        const authorEmail = author.email
        await post.updateOne(
            {
                $set: {
                    activeStatus: ActiveStatus.REMOVED
                }
            },
            { new: true }
        )
        sendMail({
            to: authorEmail,
            subject: "TekBlog - Your post has been deleted by admin",
            html: `
                        <h1>Your post with title <i>"${post.title}"</i> has been deleted by admin</h1>
                        <p>Reason: ${reason}</p>
                        <p>Please contact us by email for getting your post back!
                        <br/>Thank you!</p>
                        <p>Regards,
                        <br/>TekBlog Team.</p>
                    `
        })
            .then(() => {
                return res.json({ success: true, data: post._id, message: "Success" })
            })
            .catch((err) => {
                console.log({ err })
                return res.status(500).json({ success: false, message: "Send mail failed" })
            })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.put("/return/user", verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { user_id } = req.query
        if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" })

        const user = await User.findById(new toId(user_id.toString()))
        if (!user) return res.status(404).json({ success: false, message: "User not found" })
        if (user.activeStatus === ActiveStatus.ACTIVE)
            return res.status(400).json({ success: false, message: "User is already active" })
        user.activeStatus = ActiveStatus.ACTIVE

        const returnedUser = await user.save()
        sendMail({
            to: user.email,
            subject: "TekBlog - Your account has been returned by admin",
            html: `
                        <h1>Your account has been returned by admin</h1>
                        <p>Let's continue to use <b>TekBlog</b>!
                        <br/>Thank you!</p>
                        <p>Regards,
                        <br/>TekBlog Team.</p>
                    `
        })
            .then(() => {
                res.json({ success: true, data: returnedUser })
            })
            .catch(() => {
                res.status(500).json({ success: false, message: "Send mail failed" })
            })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.put("/return/post", verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { post_id } = req.query
        if (!post_id) return res.status(400).json({ success: false, message: "Missing post_id" })

        const post = await Post.findById(new toId(post_id.toString())).populate("author", "email")
        if (!post) return res.status(404).json({ success: false, message: "User not found" })
        if (post.activeStatus === ActiveStatus.ACTIVE)
            return res.status(400).json({ success: false, message: "Post is already active" })
        const author = post.author as IUser
        const authorEmail = author.email
        post.activeStatus = ActiveStatus.ACTIVE

        const returnedUser = await post.save()
        sendMail({
            to: authorEmail,
            subject: "TekBlog - Your post has been returned by admin",
            html: `
                        <h1>Your post has been returned by admin</h1>
                        <p>Let's see your post in your page!
                        <br/>Thank you!</p>
                        <p>Regards,
                        <br/>TekBlog Team.</p>
                    `
        })
            .then(() => {
                res.json({ success: true, data: returnedUser })
            })
            .catch(() => {
                res.status(500).json({ success: false, message: "Send mail failed" })
            })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
