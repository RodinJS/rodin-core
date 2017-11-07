export default {
    input: 'src/app.js',
    indent: '\t',
    output: [
        {
            format: 'iife',
            file: 'build/rodin_core.js',
            name: 'rodin_core',
            // sourcemap: true
        }
    ],
    treeshake: false,
    strict: false,
    onwarn: warn => {
        if (/eval/.test(warn.message)) return;
        console.warn(warn);
    }
};