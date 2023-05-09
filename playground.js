const jiti = require('jiti')();
const { compiler } = jiti('./src/index.ts');


const template = `<div><p>Vue</p><p>Template</p></div>`
const res = compiler(template)
// console.info(res);

// console.log(JSON.stringify(res));
