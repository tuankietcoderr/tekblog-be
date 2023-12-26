import type { JestConfigWithTsJest } from "ts-jest"

const config: JestConfigWithTsJest = {
    verbose: true,
    transform: {
        "^.+\\.ts?$": [
            "ts-jest",
            {
                useESM: true
            }
        ]
    },
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "fetch.ts"],
    coveragePathIgnorePatterns: ["/node_modules/", "/dist/", "fetch.ts"]
}

export default config
