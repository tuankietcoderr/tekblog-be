import { FETCH_WITH_TOKEN } from "../fetch"

describe("Tag test", () => {
    test("Create tag successfully", async () => {
        const res = await FETCH_WITH_TOKEN("/tag", {
            method: "POST",
            body: JSON.stringify({
                title: "vscode"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(true)
        expect(code).toBe(201)
        expect(message).toBe("Tag created")
        expect(data).toBeTruthy()
    })

    test("Create tag failed - Invalid title", async () => {
        const res = await FETCH_WITH_TOKEN("/tag", {
            method: "POST",
            body: JSON.stringify({
                title: "vs"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("tags validation failed: title: Title must be at least 3 characters long")
        expect(data).toBeUndefined()
    })

    test("Create tag failed - Invalid title", async () => {
        const res = await FETCH_WITH_TOKEN("/tag", {
            method: "POST",
            body: JSON.stringify({
                title: "vsvsvsvsvsvsvsvsvscsc"
            })
        })
        const { code, message, success, data } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("tags validation failed: title: Title must be at most 20 characters long")
        expect(data).toBeUndefined()
    })
})
