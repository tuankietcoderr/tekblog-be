import { PaginateModel, Schema, model } from "mongoose"
import ITag from "../interface/ITag"
import { SCHEMA } from "./schema-name"
import mongoosePaginate from "mongoose-paginate-v2"

const TagSchema = new Schema<ITag>({
    title: {
        type: String,
        required: [true, "Title is required"],
        minlength: [3, "Title must be at least 3 characters long"],
        maxlength: [20, "Tag must be at most 20 characters long"]
    },
    score: {
        type: Number,
        default: 0,
        min: [0, "Score must be at least 0"]
    }
})
TagSchema.plugin(mongoosePaginate)

export default model<ITag, PaginateModel<ITag>>(SCHEMA.TAGS, TagSchema, SCHEMA.TAGS)
