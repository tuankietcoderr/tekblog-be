import { Types } from "mongoose"
import ObjectType from "../common/object-type"
import IComment from "./IComment"
import IPost from "./IPost"
import IUser from "./IUser"

export default interface IReport {
    title: string
    content: string
    objectType: ObjectType
    object: Types.ObjectId | IUser | IPost | IComment
    refPath: string
    reporter: Types.ObjectId | IUser
    createdAt: Date
    updatedAt: Date
}
