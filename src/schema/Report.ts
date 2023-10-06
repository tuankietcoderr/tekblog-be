import { Schema, model } from "mongoose"
import IReport from "../interface/IReport"
import ObjectType from "../common/object-type"
import { SCHEMA } from "./schema-name"

const ReportSchema = new Schema<IReport>(
    {
        title: {
            type: String,
            required: true,
            minlength: [10, "Title must be at least 10 characters long"],
            maxlength: [200, "Title must be at most 200 characters long"]
        },
        content: {
            type: String,
            required: true,
            minlength: [10, "Content must be at least 10 characters long"]
        },
        objectType: {
            type: String,
            enum: Object.values(ObjectType),
            default: ObjectType.POST,
            required: [true, "Object type is required"]
        },
        refPath: {
            type: String,
            enum: [SCHEMA.USERS, SCHEMA.POSTS, SCHEMA.COMMENTS],
            required: [true, "Ref path is required"]
        },
        object: {
            type: Schema.Types.ObjectId,
            refPath: "refPath"
        },
        reporter: {
            type: Schema.Types.ObjectId,
            required: [true, "Reporter is required"],
            ref: SCHEMA.USERS
        }
    },
    {
        timestamps: true
    }
)

export default model<IReport>(SCHEMA.REPORTS, ReportSchema, SCHEMA.REPORTS)
