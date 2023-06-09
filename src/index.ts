import { parse } from "./parse"
import { transform } from "./transform"
import { generate } from "./generate"

export const compiler = (template) => {
    // 1. 生成template ast ，template ast是对模板的描述
    const templateAST = parse(template)
    console.log('parse', templateAST);

    // 2. 转化成javascript ast， 这是对代码的描述
    transform(templateAST)
    console.log('transform', templateAST);


    // 3. 生成渲染函数
    const code = generate(templateAST.jsNode)

    return code

}