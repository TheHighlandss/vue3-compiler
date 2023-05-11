import { genNode } from "../generate"
/** 生成-声明函数对应的js代码 */
export function genFunctionDecl(node: astJsNode, context: generateCtx) {
    const { push, indent, deIndent } = context
    push(`function ${node.id.name}`)
    push('(')
    genNodeList(node.params, context)
    push(') ')
    push('{')
    indent()
    node.body.forEach(n => genNode(n, context))
    deIndent()
    push('}')

}

/** 生成声明函数形参对应的js代码 */
function genNodeList(nodes: astJsNode[], context: generateCtx) {
    const { push } = context
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        genNode(node, context)
        if (i < nodes.length - 1) {
            push(',')
        }
    }
}

/** 生成-数组参数对应的js代码 */
export function genArrayExpression(node: astJsNode, context: generateCtx) {
    const { push } = context
    push('[')
    genNodeList(node.elements, context)
    push(']')
}

/** 生成-返回语句对应的js代码 */
export function genReturnStatement(node: astJsNode, context: generateCtx) {
    const { push } = context
    push('return ')
    genNode(node.return, context)
}

/** 生成-字符串参数对应的js代码 */
export function genStringLiteral(node: astJsNode, context: generateCtx) {
    const { push } = context
    push(`'${node.value}'`)
}

/** 生成-调用函数对应的js代码 */
export function genCallExpression(node: astJsNode, context: generateCtx) {
    const { push } = context
    const { callee, arguments: args } = node
    push(`${callee}(`)
    genNodeList(args, context)
    push(')')
}





