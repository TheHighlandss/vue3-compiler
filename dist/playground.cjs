'use strict';

const index = require('./index.cjs');

const template = `<div><p>Vue</p><p>Template</p></div>`;
const res = index.compiler(template);
console.log(res);
