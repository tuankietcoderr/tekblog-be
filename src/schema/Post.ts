import { Document, PaginateModel, Schema, model } from "mongoose"
import IPost from "../interface/IPost"
import ActiveStatus from "../common/active-status"
import { SCHEMA } from "./schema-name"
import mongoosePaginate from "mongoose-paginate-v2"

const PostSchema = new Schema<IPost>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            minlength: [10, "Title must be at least 10 characters long"],
            maxlength: [200, "Title must be at most 200 characters long"]
        },
        content: {
            type: String,
            required: [true, "Content is required"],
            minlength: [10, "Content must be at least 10 characters long"]
        },
        thumbnail: {
            type: String,
            default:
                "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y29kaW5nfGVufDB8fDB8fHww&w=1000&q=80"
        },
        activeStatus: {
            type: String,
            enum: Object.values(ActiveStatus),
            default: ActiveStatus.ACTIVE
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: SCHEMA.USERS,
            required: [true, "Author is required"]
        },
        isDraft: {
            type: Boolean,
            default: false
        },
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.COMMENTS
            }
        ],
        tags: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.TAGS
            }
        ],
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.USERS
            }
        ],
        saved: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.USERS
            }
        ]
    },
    {
        timestamps: true
    }
)

PostSchema.plugin(mongoosePaginate)

export default model<IPost, PaginateModel<IPost>>(SCHEMA.POSTS, PostSchema, SCHEMA.POSTS)
