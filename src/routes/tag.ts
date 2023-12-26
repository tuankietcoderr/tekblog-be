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
        res.status(500).json({ success: false, message: error.message })
    }
})

// GET ALL
router.get("/", async (req, res) => {
    try {
        const tags = await Tag.find({}).sort({ score: -1 })
        res.json({ success: true, message: "All tags", data: tags })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// GET SOME TAG WITH POSTS
router.get("/some", async (req, res) => {
    try {
        const tags = await Tag.aggregate([
            { $limit: 3 },
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
                                comments: 1,
                                isDraft: 1
                            }
                        },
                        {
                            $match: {
                                isDraft: false
                            }
                        }
                    ]
                }
            },
            { $unwind: "$posts" },
            { $sort: { score: -1 } },
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
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
