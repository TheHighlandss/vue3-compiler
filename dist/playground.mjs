import { compiler } from './index.mjs';

const template = `<div><p>Vue</p><p>Template</p></div>`;
const res = compiler(template);
console.log(res);
