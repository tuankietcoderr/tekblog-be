import { Request, Response, Router } from "express"
import ITag from "../interface/ITag"
import IUser, { EUserRole } from "../interface/IUser"
import IPost from "../interface/IPost"
import { PaginateOptions } from "mongoose"
import Tag from "../schema/Tag"
import User from "../schema/User"
import Post from "../schema/Post"

const router = Router()
// SEARCH POSTS
router.get("/", async (req: Request, res: Response) => {
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
                        ...options,
                        select: "username name avatar followers bio major"
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
                await Post.paginate(
                    { title: regex, isDraft: false },
                    {
                        ...options,
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
                    },
                    (err, result) => {
                        if (err) return res.status(500).json({ success: false, message: err.message })
                        const { docs, ...restData } = result
                        data = docs
                        rest = restData
                    }
                )
                break
            default:
                return res.status(400).json({ success: false, message: "Invalid type" })
        }
        res.json({ success: true, message: "Search result", data, ...rest })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
