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
            if (tags?.length === 0) return res.status(400).json({ success: false, message: "Tags is required" })
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
            const postPopulated = await (
                await post.populate("author", "avatar name username")
            ).populate("tags", "title")
            res.json({
                success: true,
                message: "Post created",
                data: postPopulated
            })
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
            select: "-activeStatus -__v -content",
            sort: { likes: -1, createdAt: -1 }
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
router.get("/user", async (req: Request, res: Response) => {
    try {
        const { page, limit, user_id, isDraft } = req.query
        const userId = user_id
        if (!userId) {
            return res.status(400).json({ message: "No userId provided", success: false })
        }

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
            select: "-activeStatus -__v -content",
            sort: { likes: -1, createdAt: -1 }
        } as PaginateOptions
        await Post.paginate(
            {
                isDraft: JSON.parse(isDraft as string) || false,
                author: userId
            },
            options,
            (err, result) => {
                if (err) return res.status(500).json({ success: false, message: err.message })
                const { docs, ...data } = result
                return res.json({ success: true, message: "User's posts", data: docs, ...data })
            }
        )
    } catch (error: any) {
        res.status(500).json({ message: error.message, error })
    }
})

// LIKE/UNLIKE POST
router.put("/:post_id/like", verifyToken, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user_id)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })
        const post = await Post.findById(req.params.post_id)
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        const userLikePosts = user.likedPosts.map((id) => id.toString()) as string[]
        if (userLikePosts.includes(post._id.toString())) {
            await user.updateOne({ $pull: { likedPosts: post._id } })
            await post.updateOne({ $pull: { likes: user._id } })
            return res.json({ success: true, message: "Post unliked" })
        } else {
            await user.updateOne({ $push: { likedPosts: post._id } })
            await post.updateOne({ $push: { likes: user._id } })
            return res.json({ success: true, message: "Post liked" })
        }
    } catch (error: any) {
        console.log({ error })
        res.status(500).json({ message: error.message })
    }
})

// SAVE/UNSAVE POST
router.put("/:post_id/save", verifyToken, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user_id)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })
        const post = await Post.findById(req.params.post_id)
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        const userSavePosts = user.savedPosts.map((id) => id.toString()) as string[]

        if (userSavePosts.includes(post._id.toString())) {
            await user.updateOne({ $pull: { savedPosts: post._id } })
            await post.updateOne({ $pull: { saved: user._id } })
            return res.json({ success: true, message: "Post unsaved" })
        } else {
            await user.updateOne({ $push: { savedPosts: post._id } })
            await post.updateOne({ $push: { saved: user._id } })
            return res.json({ success: true, message: "Post saved" })
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// GET POSTS BY TAG
router.get("/tag/:tag_id", async (req: Request, res: Response) => {
    try {
        const { page, limit } = req.query
        const { tag_id } = req.params
        const tag = await Tag.findById(tag_id)
        if (!tag) return res.status(404).json({ success: false, message: "Tag not found" })
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

// ARCHIVED POSTS
router.get("/archived", verifyToken, async (req: Request, res: Response) => {
    try {
        const { page, limit, type } = req.query
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
            select: "-activeStatus -__v -content",
            sort: { createdAt: -1 }
        } as PaginateOptions

        await Post.paginate(
            {
                isDraft: false,
                [type?.toString() ?? "saved"]: { $in: [req.user_id] }
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

// RELATED POSTS
router.get("/:post_id/related", async (req: Request, res: Response) => {
    try {
        const { post_id } = req.params
        const post = await Post.findById(post_id)
        if (!post) return res.status(404).json({ success: false, message: "Post not found" })
        const relatedPosts = await Post.find(
            {
                isDraft: false,
                tags: { $in: post.tags }
            },
            {
                title: 1,
                author: 1,
                createdAt: 1
            },
            {
                populate: {
                    path: "author",
                    select: "name avatar"
                }
            }
        )
        return res.json({ success: true, message: "Related posts", data: relatedPosts })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// GET POST BY ID
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("author", "username name avatar bio major createdAt")
            .populate("tags", "title")
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
            const post = await Post.findByIdAndUpdate(
                req.params.id,
                {
                    $set: req.body
                },
                {
                    new: true,
                    runValidators: true,
                    populate: [
                        {
                            path: "author",
                            select: "username avatar name"
                        },
                        {
                            path: "tags",
                            select: "title"
                        }
                    ]
                }
            )
            if (!post) return res.status(404).json({ success: false, message: "Post not found" })
            res.json({
                success: true,
                message: "Post updated",
                data: post
            })
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
