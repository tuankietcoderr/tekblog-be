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

// GET HOT TAGS
router.get("/hot", async (req, res) => {
    try {
        const tags = await Tag.find({}).sort({ score: -1 }).limit(10)
        res.json({ success: true, message: "Hot tags", data: tags })
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

export default router
