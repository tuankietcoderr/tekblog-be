import { Types } from "mongoose"
import IUser from "./IUser"

export interface IFollower {
    user: string | IUser | Types.ObjectId
    follower: string | IUser | Types.ObjectId
}

export interface IFollowing {
    user: string | IUser | Types.ObjectId
    following: string | IUser | Types.ObjectId
}
