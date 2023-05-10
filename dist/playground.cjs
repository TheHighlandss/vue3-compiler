'use strict';

const index = require('./index.cjs');

const template = `<div><p>Vue</p><p>Template</p></div>`;
index.compiler(template);
