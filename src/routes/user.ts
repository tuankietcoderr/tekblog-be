import express, { Request, Response } from "express"
import { Types } from "mongoose"
import User from "../schema/User"
import verifyToken from "../middleware/auth"
import doNotAllowFields from "../middleware/not-allow-field"
import IUser from "../interface/IUser"
import bcrypt from "bcryptjs"
import Credential from "../schema/Credential"
import { sendMail } from "../service/mailer"
import mustHaveFields from "../middleware/must-have-field"

const router = express.Router()
const toId = Types.ObjectId

// GET CURRENT USER
router.get("/", verifyToken, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(new toId(req.user_id))
            .select("-password")
            .populate("followers", "username name avatar")
            .populate("following", "username name avatar")
            .populate({
                path: "savedPosts",
                select: "-content -activeStatus -__v -isDraft",
                populate: [
                    {
                        path: "author",
                        select: "username name avatar"
                    },
                    {
                        path: "tags",
                        select: "title"
                    }
                ]
            })
            .populate({
                path: "likedPosts",
                select: "-content -activeStatus -__v -isDraft",
                populate: [
                    {
                        path: "author",
                        select: "username name avatar"
                    },
                    {
                        path: "tags",
                        select: "title"
                    }
                ]
            })
        if (!user) return res.status(400).json({ success: false, message: "User not found" })
        res.json({ success: true, data: user })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// UPDATE CURRENT USER
router.put(
    "/",
    verifyToken,
    doNotAllowFields<IUser>("role", "activeStatus", "followers", "following", "likedPosts", "savedPosts"),
    async (req: Request, res: Response) => {
        try {
            const user = await User.findById(new toId(req.user_id))
            if (!user) {
                return res.status(400).json({ success: false, message: "User does not exist" })
            }
            const update = {
                ...user.toJSON(),
                ...req.body
            }
            await user.updateOne(update, {
                new: true
            })
            res.json({ success: true, message: "User updated", data: update })
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message })
        }
    }
)

// FORGET PASSWORD
router.get("/forget-password", async (req, res) => {
    try {
        const { email } = req.query

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" })
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({ success: false, message: "Email chưa được xác thực" })
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
            to: email as string,
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

// CHANGE PASSWORD
router.put(
    "/change-password",
    verifyToken,
    mustHaveFields("oldPassword", "newPassword"),
    async (req: Request, res: Response) => {
        try {
            const { oldPassword, newPassword } = req.body
            const user = await User.findById(new toId(req.user_id))
            if (!user) {
                return res.status(400).json({ success: false, message: "User does not exist" })
            }

            const credential = await Credential.findOne({ user_id: user._id })
            if (!credential) {
                return res.status(400).json({ success: false, message: "User does not exist" })
            }

            const isMatch = await bcrypt.compare(oldPassword, credential.password)
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Incorrect old password" })
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10)
            credential.password = hashedPassword

            await credential.save()

            res.json({ success: true, message: "Success" })
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message })
        }
    }
)

// FOLLOW/UNFOLLOW USER
router.put("/:user_id/follow", verifyToken, async (req: Request, res: Response) => {
    try {
        const userToFollowId = req.params.user_id as string
        if (userToFollowId === req.user_id) {
            return res.status(400).json({ success: false, message: "You can not follow yourself" })
        }
        const user = await User.findById(req.user_id)
        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" })
        }
        const userToFollow = await User.findById(userToFollowId)
        if (!userToFollow) {
            return res.status(400).json({ success: false, message: "User does not exist" })
        }

        const userFollowing = user.following.map((id) => id.toString())
        const userToFollowFollowers = userToFollow.followers.map((id) => id.toString())

        if (userFollowing.includes(userToFollowId) && userToFollowFollowers.includes(req.user_id)) {
            await user.updateOne({ $pull: { following: userToFollowId } })
            await userToFollow.updateOne({ $pull: { followers: req.user_id } })
            return res.json({ success: true, message: "Unfollowed" })
        } else {
            await user.updateOne({ $push: { following: userToFollowId } })
            await userToFollow.updateOne({ $push: { followers: req.user_id } })
            return res.json({ success: true, message: "Followed" })
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// GET FOLLOW
router.get("/follow", async (req: Request, res: Response) => {
    try {
        const { user_id, t } = req.query
        if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" })
        if (!t) return res.status(400).json({ success: false, message: "Missing t" })
        if (t !== "followers" && t !== "following")
            return res.status(400).json({ success: false, message: "t must be followers or following" })
        const data = await User.findById(new toId(user_id.toString())).populate(t as string, "username name avatar")
        res.json({ success: true, data: t === "followers" ? data?.followers : data?.following })
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

export default router
