import { p as parse, t as transform, g as generate } from './shared/vue3-compiler.d479f803.mjs';

const compiler = (template) => {
  const templateAST = parse(template);
  transform(templateAST);
  const code = generate(templateAST.jsNode);
  return code;
};

export { compiler };
