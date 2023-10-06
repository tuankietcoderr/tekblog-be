import { Request, Response, Router } from "express"
import verifyToken from "../middleware/auth"
import IReport from "../interface/IReport"
import mustHaveFields from "../middleware/must-have-field"
import ObjectType from "../common/object-type"
import Report from "../schema/Report"
import { Types } from "mongoose"
import doNotAllowFields from "../middleware/not-allow-field"
import { SCHEMA } from "../schema/schema-name"

const router = Router()
const toId = Types.ObjectId

// REPORT OBJECT
router.post(
    "/",
    verifyToken,
    doNotAllowFields<IReport>("createdAt", "updatedAt", "reporter"),
    mustHaveFields<IReport>("content", "title", "objectType"),
    async (req: Request, res: Response) => {
        try {
            const { object, objectType, content, title } = req.body as IReport
            if (!Object.values(ObjectType).includes(objectType))
                return res.status(400).json({ success: false, message: "Invalid object type" })
            const report = new Report({
                object: objectType === ObjectType.APPLICATION ? null : new toId(object.toString()),
                objectType,
                content,
                title,
                reporter: new toId(req.user_id),
                refPath:
                    objectType === ObjectType.APPLICATION
                        ? null
                        : objectType === ObjectType.POST
                        ? SCHEMA.POSTS
                        : objectType === ObjectType.COMMENT
                        ? SCHEMA.COMMENTS
                        : SCHEMA.USERS
            })
            await report.save()
            res.status(201).json({ success: true, message: "Report created", data: report })
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message })
        }
    }
)

export default router
