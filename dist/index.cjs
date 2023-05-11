'use strict';

const generate = require('./shared/vue3-compiler.4f7c76c9.cjs');

const compiler = (template) => {
  const templateAST = generate.parse(template);
  generate.transform(templateAST);
  const code = generate.generate(templateAST.jsNode);
  return code;
};

exports.compiler = compiler;
