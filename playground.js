const jiti = require('jiti')();
const { compiler } = jiti('./src/index.ts');


const template = `<div><p></p></div>`
const res = compiler(template)
// console.info(res);
// console.log(template);

// console.log(JSON.stringify(res));
