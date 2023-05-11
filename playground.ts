import { compiler } from './src/index'
import { parse } from './src/parse'
import { transform } from './src/transform'
import { generate } from './src/generate'


const template = `<div><p>Vue</p><p>Template</p></div>`
// const res = compiler(template)
// console.log(res);

// console.log(JSON.stringify(res));

let results: any = {}

const parseBtn = document.querySelector('#parse')
parseBtn.addEventListener('click', () => {
    results = parse(template)
    console.log(results);
})

const transformBtn = document.querySelector('#transform')
transformBtn.addEventListener('click', () => {
    transform(results)
    console.log(results);
})


const generateBtn = document.querySelector('#generate')
generateBtn.addEventListener('click', () => {
    const code = generate(results.jsNode)
    console.log(code);
})

