import { parse } from "./parse"
import { transform } from "./transform"
import { generate } from "./generate"

export const compiler = (template) => {
    const templateAST = parse(template)
    const jsAST = transform(templateAST)
    const code = generate(jsAST)
}