import { FETCH } from "../fetch"

describe("Sign up test", () => {
    test("Sign up successfully", async () => {
        const rand = Math.round(Math.random() * 10000).toString()
        const res = await FETCH("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                username: `tuankietcoderr${rand}`,
                password: "12345678",
                name: "Tuan Kiet",
                email: `kiet${rand}@gmail.com`
            })
        })
        const { code, message, success, accessToken } = res
        expect(success).toBe(true)
        expect(code).toBe(200)
        expect(message).toBe("User created")
        expect(accessToken).toBeTruthy()
    })

    test("Sign up failed test - Invalid username", async () => {
        const res = await FETCH("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                username: "test",
                password: "12345678",
                name: "Tuan Kiet",
                email: "kiett@gmail.com"
            })
        })
        const { code, message, success, accessToken } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("users validation failed: username: Username must be at least 6 characters long")
        expect(accessToken).toBeUndefined()
    })

    test("Sign up failed test - Invalid username", async () => {
        const res = await FETCH("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                username: "testtestesttesttesttesttest",
                password: "12345678",
                name: "Tuan Kiet",
                email: "kiett@gmail.com"
            })
        })
        const { code, message, success, accessToken } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("users validation failed: username: Username must be at most 20 characters long")
        expect(accessToken).toBeUndefined()
    })

    test("Sign up failed test - Invalid name", async () => {
        const res = await FETCH("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                username: "test1",
                password: "12345678",
                name: "t",
                email: "kiett@gmail.com"
            })
        })
        const { code, message, success, accessToken } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe(
            "users validation failed: username: Username must be at least 6 characters long, name: Name must be at least 3 characters long"
        )
        expect(accessToken).toBeUndefined()
    })

    test("Sign up failed test - Invalid email", async () => {
        const res = await FETCH("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                username: "test11",
                password: "12345678",
                name: "tuan kiet",
                email: "kiettgmail.com"
            })
        })
        const { code, message, success, accessToken } = res
        expect(success).toBe(false)
        expect(code).toBe(500)
        expect(message).toBe("users validation failed: email: Email is invalid")
        expect(accessToken).toBeUndefined()
    })
})
