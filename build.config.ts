import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    entries: ['./playground', './src/index'],
    clean: false,
    declaration: true,
    rollup: {
        emitCJS: true,
    },
    failOnWarn: false,
})
