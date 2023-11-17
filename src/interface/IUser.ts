import { Types } from "mongoose"
import ActiveStatus from "../common/active-status"
import IPost from "./IPost"

export enum EUserRole {
    ADMIN = "admin",
    GUEST = "guest"
}

export default interface IUser {
    username: string
    password?: string
    role: EUserRole
    name: string
    avatar?: string
    email: string
    major: string
    bio?: string
    activeStatus: ActiveStatus
    isEmailVerified: boolean
    followers: Types.ObjectId[] | IUser[]
    following: Types.ObjectId[] | IUser[]
    likedPosts: Types.ObjectId[] | IPost[]
    savedPosts: Types.ObjectId[] | IPost[]
    createdAt: Date
    updatedAt: Date
}
