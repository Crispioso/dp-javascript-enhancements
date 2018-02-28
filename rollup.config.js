import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify-es';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import tslint from 'rollup-plugin-tslint';
import latestTypescript from 'typescript';

const plugins = [
    resolve(),
    commonjs({
        sourceMap: process.env.BUILD !== "prod"
    }),
    tslint({
        project: "*.ts",
        exclude: 'node_modules/**'
    }),
    typescript({
        exclude: 'node_modules/**',
        typescript: latestTypescript
    }),
    babel({
        exclude: 'node_modules/**'
    }),
]

if (process.env.BUILD === "prod") {
    console.log("Production build: uglify output bundle.js");
    plugins.push(uglify());
}

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'iife'
    },
    plugins
};