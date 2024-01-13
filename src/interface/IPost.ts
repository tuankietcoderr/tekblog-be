import { Types } from "mongoose"
import ActiveStatus from "../common/active-status"
import IComment from "./IComment"
import ITag from "./ITag"
import IUser from "./IUser"

export default interface IPost {
    title: string
    content: string
    thumbnail: string
    isDraft: boolean
    activeStatus: ActiveStatus
    author: Types.ObjectId | IUser
    likes: Types.ObjectId[] | IUser[]
    saved: Types.ObjectId[] | IUser[]
    commentsCount: number
    tags: Types.ObjectId[] | ITag[]
    createdAt: Date
    updatedAt: Date
}
