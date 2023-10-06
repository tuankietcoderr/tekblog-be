import { Request, Response, Router } from "express"
import { PaginateOptions, Types } from "mongoose"
import IPost from "../interface/IPost"
import verifyToken from "../middleware/auth"
import mustHaveFields from "../middleware/must-have-field"
import doNotAllowFields from "../middleware/not-allow-field"
import Post from "../schema/Post"
import { SCHEMA } from "../schema/schema-name"
import Tag from "../schema/Tag"
import User from "../schema/User"
import Comment from "../schema/Comment"
import IComment from "../interface/IComment"
import ITag from "../interface/ITag"
import IUser, { EUserRole } from "../interface/IUser"

const router = Router()
const toId = Types.ObjectId

// CREATE POST
router.post(
    "/",
    verifyToken,
    doNotAllowFields<IPost>("activeStatus", "author", "comments", "likes"),
    mustHaveFields<IPost>("content", "tags", "title"),
    async (req: Request, res: Response) => {
        try {
            const { tags } = req.body
            const tagsFromDB = await Tag.find({ _id: { $in: tags } })
            if (tagsFromDB.length !== tags.length) {
                return res.status(400).json({ success: false, message: "Tags not found" })
            }
            const author = new toId(req.user_id)
            const post = new Post({
                ...req.body,
                author
            })
            await post.save()

            res.json({ success: true, message: "Post created", data: post })
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }
)

// GET POSTS
router.get("/", async (req: Request, res: Response) => {
    try {
        const { page, limit } = req.query
        const options = {
            page: page ?? 1,
            limit: limit ?? 10,
            populate: [
                {
                    path: "author",
                    select: "username name avatar"
                },
                {
                    path: "tags",
                    select: "title"
                }
            ],
            select: "-activeStatus -__v -content"
        } as PaginateOptions

        await Post.paginate(
            {
                isDraft: false
            },
            options,
            (err, result) => {
                if (err) return res.status(500).json({ success: false, message: err.message })
                const { docs, ...data } = result
                return res.json({ success: true, message: "Posts", data: docs, ...data })
            }
        )
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

//GET HOT POST
router.get("/hot", async (req: Request, res: Response) => {
    try {
        const posts = await Post.find(
            {
                isDraft: false
            },
            undefined,
            {
                limit: 1
            }
        )
            .sort({ likes: -1, comments: -1, createdAt: -1 })
            .populate("author", "username name")
            .populate("tags", "title")
            .select("-activeStatus -__v -content")
        res.json({ success: true, message: "Posts", data: posts })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// GET USER POSTS
router.get("/user", verifyToken, async (req: Request, res: Response) => {
    try {
        const { page, limit } = req.query
        const options = {
            page: page ?? 1,
            limit: limit ?? 10,
            populate: [
                {
                    path: "author",
                    select: "username name avatar"
                },
                {
                    path: "tags",
                    select: "title"
                }
            ],
            select: "-activeStatus -__v -content"
        } as PaginateOptions

        await Post.paginate(
            {
                isDraft: false
            },
            options,
            (err, result) => {
                if (err) return res.status(500).json({ success: false, message: err.message })
                const { docs, ...data } = result
                return res.json({ success: true, message: "User's posts", data: docs, ...data })
            }
        )
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// SEARCH POSTS
router.get("/search", async (req: Request, res: Response) => {
    try {
        const { type, q, limit, page } = req.query
        const regex = { $regex: q as string, $options: "i" }
        let data = [] as (ITag | IUser | IPost)[]
        let rest = {}
        const options: PaginateOptions = {
            limit: Number(limit) || 10,
            page: Number(page) || 1
        }
        switch (type) {
            case "tag":
                await Tag.paginate(
                    { title: regex },
                    {
                        ...options,
                        sort: { score: -1 }
                    },
                    (err, result) => {
                        if (err) return res.status(500).json({ success: false, message: err.message })
                        const { docs, ...restData } = result
                        data = docs
                        rest = restData
                    }
                )
                break
            case "user":
                await User.paginate(
                    {
                        $or: [
                            {
                                username: regex
                            },
                            {
                                name: regex
                            }
                        ],
                        role: EUserRole.GUEST
                    },
                    {
                        ...options
                    },
                    (err, result) => {
                        if (err) return res.status(500).json({ success: false, message: err.message })
                        const { docs, ...restData } = result
                        data = docs
                        rest = restData
                    }
                )
                break
            case "post":
                await Post.paginate({ title: regex, isDraft: false }, { ...options }, (err, result) => {
                    if (err) return res.status(500).json({ success: false, message: err.message })
                    const { docs, ...restData } = result
                    data = docs
                    rest = restData
                })
                break
            default:
                return res.status(400).json({ success: false, message: "Invalid type" })
        }
        res.json({ success: true, message: "Search result", data, ...rest })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// LIKE/UNLIKE POST
router.put("/like", verifyToken, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user_id)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })
        const post = await Post.findById(req.query.post_id)
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        const userLikePosts = user.likedPosts.map((id) => id.toString()) as string[]
        if (userLikePosts.includes(post._id.toString())) {
            await user.updateOne({ $pull: { likedPosts: post._id } })
            await post.updateOne({ $inc: { likes: -1 } })
            return res.json({ success: true, message: "Post unliked" })
        } else {
            await user.updateOne({ $push: { likedPosts: post._id } })
            await post.updateOne({ $inc: { likes: 1 } })
            return res.json({ success: true, message: "Post liked" })
        }
    } catch (error: any) {
        console.log({ error })
        res.status(500).json({ message: error.message })
    }
})

// SAVE/UNSAVE POST
router.put("/save", verifyToken, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user_id)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })
        const post = await Post.findById(req.query.post_id)
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        const userSavePosts = user.savedPosts.map((id) => id.toString()) as string[]

        if (userSavePosts.includes(post._id.toString())) {
            await user.updateOne({ $pull: { savedPosts: post._id } })
            await post.updateOne({ $inc: { saved: -1 } })
            return res.json({ success: true, message: "Post unsaved" })
        } else {
            await user.updateOne({ $push: { savedPosts: post._id } })
            await post.updateOne({ $inc: { saved: 1 } })
            return res.json({ success: true, message: "Post saved" })
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// COMMENT POST
router.post(
    "/comment",
    verifyToken,
    mustHaveFields<IComment>("content", "post"),
    async (req: Request, res: Response) => {
        try {
            const { content, post } = req.body
            const user = await User.findById(req.user_id)
            if (!user) return res.status(404).json({ success: false, message: "User not found" })
            const comment = new Comment({
                author: user._id,
                content,
                post
            })
            await comment.save()
            await Post.findByIdAndUpdate(post, { $push: { comments: comment._id } })
            res.json({ success: true, message: "Comment created", data: comment })
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }
)

router.get("/comment", async (req: Request, res: Response) => {
    try {
        const { page, limit, post_id } = req.query
        console.log({ post_id })
        const options = {
            page: page ?? 1,
            limit: limit ?? 10,
            populate: [
                {
                    path: "author",
                    select: "username name avatar"
                }
            ],
            select: "-__v"
        } as PaginateOptions

        await Comment.paginate(
            {
                post: post_id
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
router.delete("/comment/:id", verifyToken, async (req: Request, res: Response) => {
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

// GET POSTS BY TAG
router.get("/tag", async (req: Request, res: Response) => {
    try {
        const { page, limit, tag_id } = req.query
        const options = {
            page: page ?? 1,
            limit: limit ?? 10,
            populate: [
                {
                    path: "author",
                    select: "username name avatar"
                }
            ],
            select: "-activeStatus -__v -content"
        } as PaginateOptions

        await Post.paginate(
            {
                isDraft: false,
                tags: { $in: [tag_id] }
            },
            options,
            (err, result) => {
                if (err) return res.status(500).json({ success: false, message: err.message })
                const { docs, ...data } = result
                return res.json({ success: true, message: "Posts", data: docs, ...data })
            }
        )
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// GET POST BY ID
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("author", "username name avatar")
            .populate("tags", "title")
            .populate({
                path: "comments",
                populate: {
                    path: "author",
                    select: "name username -_id"
                },
                select: "-post -__v -updatedAt"
            })
            .select("-activeStatus -__v")
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        await Tag.updateMany({ _id: { $in: post.tags } }, { $inc: { score: 1 } })
        res.json({ success: true, message: "Post", data: post })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// UPDATE POST
router.put(
    "/:id",
    verifyToken,
    doNotAllowFields<IPost>("activeStatus", "author", "comments", "createdAt", "likes"),
    async (req: Request, res: Response) => {
        try {
            const post = await Post.findById(req.params.id)
            if (!post) return res.status(404).json({ success: false, message: "Post not found" })
            if (post.author.toString() !== req.user_id) {
                return res.status(403).json({ success: false, message: "You are not the author of this post" })
            }
            const { tags } = req.body
            const tagsFromDB = await Tag.find({ _id: { $in: tags } })
            if (tagsFromDB.length !== tags.length) {
                return res.status(400).json({ success: false, message: "Tags not found" })
            }
            const newPost = await post.updateOne(req.body, { new: true })
            res.json({ success: true, message: "Post updated", data: newPost })
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }
)

// DELETE POST
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        if (post.author.toString() !== req.user_id) {
            return res.status(403).json({ success: false, message: "You are not the author of this post" })
        }
        await post.deleteOne()
        await User.findOneAndUpdate({ _id: req.user_id }, { $pull: { likedPosts: post._id } })
        await Comment.deleteMany({ post: post._id })
        res.json({ success: true, message: "Post deleted" })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

export default router
