import { p as parse, t as transform, g as generate } from './shared/vue3-compiler.d479f803.mjs';

const template = `<div><p>Vue</p><p>Template</p></div>`;
let results = {};
const parseBtn = document.querySelector("#parse");
parseBtn.addEventListener("click", () => {
  results = parse(template);
  console.log(results);
});
const transformBtn = document.querySelector("#transform");
transformBtn.addEventListener("click", () => {
  transform(results);
  console.log(results);
});
const generateBtn = document.querySelector("#generate");
generateBtn.addEventListener("click", () => {
  const code = generate(results.jsNode);
  console.log(code);
});
