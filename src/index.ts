import { parse } from "./parse"
import { transform } from "./transform"
import { generate } from "./generate"

export const compiler = (template) => {
    const templateAST = parse(template)
    transform(templateAST)


    return templateAST
    // const code = generate(jsAST)
}