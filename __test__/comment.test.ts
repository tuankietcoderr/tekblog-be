import { FETCH_WITH_TOKEN } from "../fetch"

describe("Comment test", () => {
    test("Create comment successfully", async () => {
        const res = await FETCH_WITH_TOKEN("/comment/post/65897600decb69fd651bbbf0", {
            method: "POST",
            body: JSON.stringify({
                content: "Test comment"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(true)
        expect(code).toBe(201)
        expect(message).toBe("Comment created")
        expect(data).toBeTruthy()
    })

    test("Create comment failed - Invalid content", async () => {
        const res = await FETCH_WITH_TOKEN("/comment/post/65897600decb69fd651bbbf0", {
            method: "POST",
            body: JSON.stringify({
                content: ""
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("comments validation failed: content: Content is required")
        expect(data).toBeUndefined()
    })
})
