import { FETCH, FETCH_WITH_TOKEN } from "../fetch"

describe("Post test", () => {
    test("Create post successfully", async () => {
        const res = await FETCH_WITH_TOKEN("/post", {
            method: "POST",
            body: JSON.stringify({
                title: "Test posts",
                content: "Test content",
                tags: ["658974aab90b5eb778561db5"]
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(true)
        expect(code).toBe(201)
        expect(message).toBe("Post created")
        expect(data).toBeTruthy()
    })

    test("Create post failed - Invalid title", async () => {
        const res = await FETCH_WITH_TOKEN("/post", {
            method: "POST",
            body: JSON.stringify({
                title: "Test",
                content: "Test content",
                tags: ["658974aab90b5eb778561db5"]
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("posts validation failed: title: Title must be at least 10 characters long")
        expect(data).toBeUndefined()
    })

    test("Create post failed - Invalid title", async () => {
        const res = await FETCH_WITH_TOKEN("/post", {
            method: "POST",
            body: JSON.stringify({
                title: "Testttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt Testttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt Testttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
                content: "Test content",
                tags: ["658974aab90b5eb778561db5"]
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("posts validation failed: title: Title must be at most 200 characters long")
        expect(data).toBeUndefined()
    })

    test("Create post failed - Invalid content", async () => {
        const res = await FETCH_WITH_TOKEN("/post", {
            method: "POST",
            body: JSON.stringify({
                title: "Test posts",
                content: "Test",
                tags: ["658974aab90b5eb778561db5"]
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("posts validation failed: content: Content must be at least 10 characters long")
        expect(data).toBeUndefined()
    })

    test("Create post failed - Invalid tag", async () => {
        const res = await FETCH_WITH_TOKEN("/post", {
            method: "POST",
            body: JSON.stringify({
                title: "Test posts",
                content: "Test content"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(400)
        expect(message).toBe("Missing fields: tags")
        expect(data).toBeUndefined()
    })
})
