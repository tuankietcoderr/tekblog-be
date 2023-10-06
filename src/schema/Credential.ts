import { Schema, Types, model } from "mongoose"
import { SCHEMA } from "./schema-name"
import ICredential from "../interface/ICredential"

const CredentialSchema = new Schema<ICredential>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: SCHEMA.USERS
    },
    password: {
        type: String
    }
})

export default model<ICredential>(SCHEMA.CREDENTIALS, CredentialSchema, SCHEMA.CREDENTIALS)
