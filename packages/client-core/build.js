const esbuild = require('esbuild');
const sassPlugin = require('esbuild-plugin-sass')

esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    outfile: 'lib/index.js',
    plugins: [sassPlugin()],
    platform: "browser",
    define: {
        ["process.env.NODE_ENV"]: "'production'",
        ["process.env.BUILD_MODE"]: true
    },
    external: ['fs', 'path', '@xrengine/common', '@xrengine/engine'],
    minify: true,
    sourcemap: true
}).catch((e) => console.error(e.message))
