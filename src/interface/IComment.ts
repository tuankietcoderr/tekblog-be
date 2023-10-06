import { Types } from "mongoose"
import IUser from "./IUser"
import IPost from "./IPost"

export default interface IComment {
    content: string
    author: Types.ObjectId | IUser
    post: Types.ObjectId | IPost
    createdAt: Date
    updatedAt: Date
}
