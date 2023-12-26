import { FETCH } from "../fetch"

describe("Sign in test", () => {
    test("Sign in successfully", async () => {
        const res = await FETCH("/auth/signin", {
            method: "POST",
            body: JSON.stringify({
                usernameOrEmail: "tuankietcoder",
                password: "12345678"
            })
        })
        const { code, message, success, accessToken } = res
        expect(success).toBe(true)
        expect(code).toBe(200)
        expect(message).toBe("User logged in")
        expect(accessToken).toBeTruthy()
    })

    test("Sign in failed test - Wrong password", async () => {
        const res = await FETCH("/auth/signin", {
            method: "POST",
            body: JSON.stringify({
                usernameOrEmail: "tuankietcoder",
                password: "1234567"
            })
        })
        const { code, message, success, accessToken } = res
        expect(success).toBe(false)
        expect(code).toBe(400)
        expect(message).toBe("Wrong password")
        expect(accessToken).toBeUndefined()
    })
})
