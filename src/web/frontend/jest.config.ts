module.exports = {\n
preset: 'ts-jest',\n
testEnvironment: 'jsdom',\n
setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],\n
moduleNameMapper: {\n
    '\\\\.(css|less|scss|sass)$'
:
    'identity-obj-proxy',\n
    '^@/(.*)$'
:
    '<rootDir>/src/$1'\n
}
,\n
collectCoverageFrom: [\n
'src/**/*.{ts,tsx}',\n
'!src/index.tsx',\n
'!src/setupTests.ts'\n
],\n
transform: {\n
    '^.+\\\\.tsx?$'
:
    'ts-jest'\n
}
,\n
testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\\\.tsx?$',\n
moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']\n
}
;