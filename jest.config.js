/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.((t|j)s|(t|j)sx)$": "ts-jest",
  },
  moduleFileExtensions: ["js", "ts", "json"],
  testPathIgnorePatterns: ["dist"],
};
