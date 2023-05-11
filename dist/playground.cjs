'use strict';

const generate = require('./shared/vue3-compiler.4f7c76c9.cjs');

const template = `<div><p>Vue</p><p>Template</p></div>`;
let results = {};
const parseBtn = document.querySelector("#parse");
parseBtn.addEventListener("click", () => {
  results = generate.parse(template);
  console.log(results);
});
const transformBtn = document.querySelector("#transform");
transformBtn.addEventListener("click", () => {
  generate.transform(results);
  console.log(results);
});
const generateBtn = document.querySelector("#generate");
generateBtn.addEventListener("click", () => {
  const code = generate.generate(results.jsNode);
  console.log(code);
});
