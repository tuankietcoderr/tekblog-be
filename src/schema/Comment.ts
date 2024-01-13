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
            required: [true, "Author is required"],
            autopopulate: true
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: SCHEMA.POSTS,
            required: [true, "Post is required"]
        },
        children: [
            {
                type: Schema.Types.ObjectId,
                ref: SCHEMA.COMMENTS,
                autopopulate: true
            }
        ],
        parent: {
            type: Schema.Types.ObjectId,
            ref: SCHEMA.COMMENTS,
            default: null
        },
        isLikedByMe: {
            type: Boolean,
            default: false
        },
        likesCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
)

CommentSchema.pre("find", function () {
    this.populate("author", "username name avatar")
    this.populate("children")
    this.sort({ createdAt: -1 })
})

CommentSchema.pre("save", function (next) {
    this.populate("author", "username name avatar")
    next()
})

CommentSchema.plugin(mongoosePaginate)

export default model<IComment, PaginateModel<IComment>>(SCHEMA.COMMENTS, CommentSchema, SCHEMA.COMMENTS)
