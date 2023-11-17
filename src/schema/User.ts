import { PaginateModel, Schema, model } from "mongoose"
import { SCHEMA } from "./schema-name"
import IUser, { EUserRole } from "../interface/IUser"
import ActiveStatus from "../common/active-status"
import mongoosePaginate from "mongoose-paginate-v2"

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            unique: true,
            required: [true, "Username is required"],
            minlength: [6, "Username must be at least 6 characters long"],
            maxlength: [20, "Username must be at most 20 characters long"],
            match: [/^[a-zA-Z0-9]+$/, "Username must contain only letters and numbers"]
        },
        role: {
            type: String,
            enum: Object.values(EUserRole),
            default: EUserRole.GUEST
        },
        email: {
            type: String,
            unique: true,
            required: [true, "Email is required"],
            match: [/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/, "Email is invalid"]
        },
        avatar: {
            type: String,
            default: "https://i.ibb.co/G5dMxjM/pngwing-com.png"
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            minlength: [3, "Name must be at least 3 characters long"],
            maxlength: [20, "Name must be at most 20 characters long"]
        },
        major: {
            type: String,
            default: "Unknown"
        },
        bio: {
            type: String
        },
        activeStatus: {
            type: String,
            enum: Object.values(ActiveStatus),
            default: ActiveStatus.ACTIVE
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        followers: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.USERS
            }
        ],
        following: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.USERS
            }
        ],
        likedPosts: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.POSTS
            }
        ],
        savedPosts: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.POSTS
            }
        ]
    },
    {
        timestamps: true
    }
)
UserSchema.plugin(mongoosePaginate)

export default model<IUser, PaginateModel<IUser>>(SCHEMA.USERS, UserSchema, SCHEMA.USERS)
