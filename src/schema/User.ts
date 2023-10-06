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
            default:
                "https://secure.gravatar.com/avatar/98d6687c39c37e423d5d80b06ffd65e4?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Fdefault-avatar-0.png"
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            minlength: [3, "Name must be at least 3 characters long"],
            maxlength: [50, "Name must be at most 50 characters long"]
        },
        major: {
            type: [String],
            default: []
        },
        bio: {
            type: String,
            minlength: [10, "Bio must be at least 10 characters long"],
            maxlength: [200, "Bio must be at most 200 characters long"]
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
).pre("updateOne", function (next) {
    if (!this.get("email")) {
        next()
    }
    if (!this.get("email").match(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/)) {
        next(new Error("Email is invalid"))
    } else {
        next()
    }
})

UserSchema.plugin(mongoosePaginate)

export default model<IUser, PaginateModel<IUser>>(SCHEMA.USERS, UserSchema, SCHEMA.USERS)
