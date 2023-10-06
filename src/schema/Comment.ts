import { PaginateModel, Schema, model } from "mongoose"
import IComment from "../interface/IComment"
import { SCHEMA } from "./schema-name"
import mongoosePaginate from "mongoose-paginate-v2"

const CommentSchema = new Schema<IComment>(
    {
        content: {
            type: String,
            required: [true, "Content is required"],
            minlength: [1, "Content must be at least 1 characters long"]
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: SCHEMA.USERS,
            required: [true, "Author is required"]
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: SCHEMA.POSTS,
            required: [true, "Post is required"]
        }
    },
    {
        timestamps: true
    }
)

CommentSchema.plugin(mongoosePaginate)

export default model<IComment, PaginateModel<IComment>>(SCHEMA.COMMENTS, CommentSchema, SCHEMA.COMMENTS)
