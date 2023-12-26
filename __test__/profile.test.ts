import { FETCH_WITH_TOKEN } from "../fetch"

describe("Profile test", () => {
    test("Update profile successfully", async () => {
        const res = await FETCH_WITH_TOKEN("/user", {
            method: "PUT",
            body: JSON.stringify({
                name: "Tuankiet",
                bio: "Test bio",
                avatar: "https://www.google.com"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(true)
        expect(code).toBe(200)
        expect(message).toBe("User updated")
        expect(data).toBeTruthy()
    })

    test("Update profile failed - Invalid name", async () => {
        const res = await FETCH_WITH_TOKEN("/user", {
            method: "PUT",
            body: JSON.stringify({
                name: "T",
                bio: "Test bio",
                avatar: "https://www.google.com"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("Validation failed: name: Name must be at least 3 characters long")
        expect(data).toBeUndefined()
    })

    test("Update profile failed - Invalid name", async () => {
        const res = await FETCH_WITH_TOKEN("/user", {
            method: "PUT",
            body: JSON.stringify({
                name: "TTTTTTTTTTTTTTTTTTTTTTTTT",
                bio: "Test bio",
                avatar: "https://www.google.com"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("Validation failed: name: Name must be at most 20 characters long")
        expect(data).toBeUndefined()
    })

    test("Update profile failed - Invalid email", async () => {
        const res = await FETCH_WITH_TOKEN("/user", {
            method: "PUT",
            body: JSON.stringify({
                email: "tuankietcoder"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("Validation failed: email: Email is invalid")
        expect(data).toBeUndefined()
    })
})
