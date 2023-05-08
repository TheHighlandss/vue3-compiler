const jiti = require('jiti')();
const { compiler } = jiti('./src/index.ts');


const template = `<div>hello</div>`
const res = compiler(template)
console.log(res);