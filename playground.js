const jiti = require('jiti')();
const { compiler } = jiti('./src/index.ts');


// const template = `<div id="btn" @click="handler"></div>`
// const template = `<div id="btn" @click="handler">这是一段文字</div>`
const template = `<div id="btn" @click="handler">这是一段文字<span>asd</span>{{true ? 1 : 2}}</div>`
const res = compiler(template)
// console.info(res);
// console.log(template);

// console.log(JSON.stringify(res));
