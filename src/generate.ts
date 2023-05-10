import { genFunctionDecl, genReturnStatement, genCallExpression, genStringLiteral, genArrayExpression } from './generate/genExpression'

export const generate = (node: astJsNode) => {
    const context: generateCtx = {
        code: '', // 最终生成的代码
        push(code) {
            context.code += code
        },
        currentIndent: 0, // 缩进
        // 换行
        newLine() {
            context.code += '\n' + `  `.repeat(context.currentIndent)
        },
        // 增加缩进
        indent() {
            context.currentIndent++
            context.newLine()
        },
        // 减小缩进
        deIndent() {
            context.currentIndent--
            context.newLine()
        }
    }

    genNode(node, context)

    return context.code
}

export function genNode(node: astJsNode, context: generateCtx) {
    switch (node.type) {
        case 'FunctionDecl':
            genFunctionDecl(node, context)
            break;

        case 'ReturnStatement':
            genReturnStatement(node, context)
            break;

        case 'CallExpression':
            genCallExpression(node, context)
            break;

        case 'StringLiteral':
            genStringLiteral(node, context)
            break;

        case 'ArrayExpression':
            genArrayExpression(node, context)
            break;

        default:
            break;
    }
}