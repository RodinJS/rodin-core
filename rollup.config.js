export default {
    input: 'src/app.js',
    indent: '\t',
    plugins: [
    ],
    // sourceMap: true,
    targets: [
        {
            format: 'iife',
            moduleName: 'rodin_core',
            dest: 'build/rodin_core.js'
        }
    ],
    treeshake: false
};