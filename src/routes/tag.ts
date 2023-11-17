import { Router } from "express"
import verifyToken from "../middleware/auth"
import mustHaveFields from "../middleware/must-have-field"
import ITag from "../interface/ITag"
import Tag from "../schema/Tag"
import { PaginateOptions } from "mongoose"

const router = Router()

// CREATE TAG
router.post("/", verifyToken, mustHaveFields<ITag>("title"), async (req, res) => {
    try {
        const tag = new Tag({
            ...req.body
        })
        await tag.save()
        res.status(201).json({ success: true, message: "Tag created", data: tag })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// GET ALL
router.get("/", async (req, res) => {
    try {
        const options: PaginateOptions = {
            sort: { score: -1 }
        }
        await Tag.paginate({}, options, (err, result) => {
            if (err) return res.status(500).json({ message: err.message })
            const { docs, ...rest } = result
            res.json({ success: true, message: "All tags", data: docs, ...rest })
        })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// GET SOME TAG WITH POSTS
router.get("/some", async (req, res) => {
    try {
        const tags = await Tag.aggregate([
            {
                $lookup: {
                    from: "posts",
                    localField: "_id",
                    foreignField: "tags",
                    as: "posts",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                comments: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: "$posts" },
            { $sort: { "posts.score": -1 } },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    score: { $first: "$score" },
                    posts: { $push: "$posts" }
                }
            },
            { $project: { _id: 1, title: 1, score: 1, posts: { $slice: ["$posts", 0, 3] } } }
        ])
        res.json({ success: true, message: "Some tags", data: tags })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

export default router
