/** 创建StringLiteral节点： 描述字符串字面量 如形参 */
export function createStringLiteral(value: string) {
    return {
        type: 'StringLiteral',
        value
    }
}


/** 创建Identifier节点： 描述标识符 如函数名 */
export function createIdentifier(name: string) {
    return {
        type: 'Identifier',
        name
    }
}

/** 创建ArrayExpression节点： 描述数组参数 */
export function createArrayExpression(elements: unknown[]) {
    return {
        type: 'ArrayExpression',
        elements // 数组中的元素
    }
}


/** 创建CallExpression节点： 描述函数调用 */
export function createCallExpression(callee, args: unknown[]) {
    return {
        type: 'CallExpression',
        callee, // 描述被调用函数的名称
        arguments: args // 被调用函数的形参
    }
}