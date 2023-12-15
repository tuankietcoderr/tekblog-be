import bcrypt from "bcryptjs"
import express, { Request, Response } from "express"
import { Types } from "mongoose"
import IUser from "../interface/IUser"
import verifyToken from "../middleware/auth"
import mustHaveFields from "../middleware/must-have-field"
import doNotAllowFields from "../middleware/not-allow-field"
import Credential from "../schema/Credential"
import User from "../schema/User"

const router = express.Router()
const toId = Types.ObjectId

// GET CURRENT USER
router.get("/", verifyToken, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(new toId(req.user_id)).select("-password")

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
    doNotAllowFields<IUser>("role", "activeStatus", "followers", "following"),
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
router.get("/:user_id/follow", async (req: Request, res: Response) => {
    try {
        const { t } = req.query
        const { user_id } = req.params
        if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" })
        const user = await User.findById(user_id.toString())
        if (!user) return res.status(400).json({ success: false, message: "User not found" })
        if (!t) return res.status(400).json({ success: false, message: "Missing t" })
        if (t !== "followers" && t !== "following")
            return res.status(400).json({ success: false, message: "t must be followers or following" })
        const data = await user.populate(t as string, "username name avatar bio major followers following")
        res.json({ success: true, data: (t === "followers" ? data?.followers : data?.following) || [] })
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message })
    }
})

// GET BY ID
router.get("/:user_id", async (req: Request, res: Response) => {
    try {
        const user = await User.findById(new toId(req.params.user_id)).select("-password")

        if (!user) return res.status(400).json({ success: false, message: "User not found" })
        res.json({ success: true, data: user })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
