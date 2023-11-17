import { Request, Response, Router } from "express"
import verifyToken from "../middleware/auth"
import mustHaveFields from "../middleware/must-have-field"
import IComment from "../interface/IComment"
import Post from "../schema/Post"
import User from "../schema/User"
import Comment from "../schema/Comment"
import { PaginateOptions } from "mongoose"

const router = Router()

// COMMENT POST
router.post("/post/:postId", verifyToken, mustHaveFields<IComment>("content"), async (req: Request, res: Response) => {
    try {
        const { content, post } = req.body
        const { postId } = req.params
        const user = await User.findById(req.user_id)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })
        const comment = new Comment({
            author: user._id,
            content,
            post: postId
        })
        await comment.save()
        await Post.findByIdAndUpdate(post, { $push: { comments: comment._id } })
        res.json({ success: true, message: "Comment created", data: comment })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

router.get("/post/:postId", async (req: Request, res: Response) => {
    try {
        const { page, limit } = req.query
        const { postId } = req.params
        const options = {
            page: page ?? 1,
            limit: limit ?? 10,
            populate: [
                {
                    path: "author",
                    select: "username name avatar"
                }
            ],
            select: "-__v",
            sort: { createdAt: -1 }
        } as PaginateOptions

        await Comment.paginate(
            {
                post: postId
            },
            options,
            (err, result) => {
                if (err) return res.status(500).json({ success: false, message: err.message })
                const { docs, ...data } = result
                return res.json({ success: true, message: "Comments", data: docs, ...data })
            }
        )
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// DELETE COMMENT
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
    try {
        const comment = await Comment.findById(req.params.id)
        if (!comment) return res.status(404).json({ success: false, message: "Comment not found" })
        if (comment.author.toString() !== req.user_id) {
            return res.status(403).json({ success: false, message: "You are not the author of this comment" })
        }
        await comment.deleteOne()
        await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } })
        res.json({ success: true, message: "Comment deleted" })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

export default router
