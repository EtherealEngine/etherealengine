process.env.APP_ENV = 'test'
process.env.TS_NODE_FILES = true
process.env.TS_NODE_PROJECT = 'tsconfig.json'
process.env.TS_NODE_COMPILER_OPTIONS = '{\"module\": \"esnext\" }'
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'
require("fix-esm").register()