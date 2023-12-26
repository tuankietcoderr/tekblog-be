import { configDotenv } from "dotenv"

configDotenv()
const API_ROUTE = `http://localhost:${process.env.PORT}/api`

export const FETCH = async <T = any>(
    url: string,
    // eslint-disable-next-line no-undef
    options?: RequestInit
): Promise<FetchResponse<T>> => {
    const opts = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...options?.headers
        }
    }
    try {
        const res = await fetch(`${API_ROUTE}${url}`, opts)
        const data = await res.json()
        return {
            ...data,
            code: res.status
        }
    } catch (error: any) {
        return {
            success: false,
            message: error?.response?.message ?? error?.message,
            code: error?.status
        } as FetchResponse<T>
    }
}

const TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjU4OTcwNTk4YjdjMDU4MDFjZTFmOTVlIiwiaWF0IjoxNzAzNTA2NjQ4LCJleHAiOjE3MzUwNjQyNDh9.9vCWvXhpVMF2aGYA9hyhrFp5EQJcgWE8AxJuqQnYZU4"

export const FETCH_WITH_TOKEN = async <T = any>(
    url: string,
    // eslint-disable-next-line no-undef
    options?: RequestInit
): Promise<FetchResponse<T>> => {
    return await FETCH<T>(url, {
        ...options,
        headers: {
            ...options?.headers,
            Authorization: "Bearer " + TOKEN
        }
    })
}

export interface FetchResponse<T = any> {
    data?: T
    message: string
    success: boolean
    code: number
    accessToken?: string
}
