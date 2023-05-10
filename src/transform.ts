/**
 * 
模板：
<div><p>Vue</p><p>Template</p></div>

模板AST:
{
    type: 'Root',
    children : [
        type: 'Element',
        tag: 'div',
        children: [
            {
                type: 'Element',
                tag: 'p',
                children: [
                    {
                        type: 'Text',
                        content: 'vue'
                    }
                ]
            },
            ...
        ]
    ]
}

js ast:
    ?


渲染函数：
function renderFn(){
    return h('div', [
        h('p', 'vue'),
        h('p', 'template'),
    ])
}

 */
import { createStringLiteral, createIdentifier, createArrayExpression, createCallExpression } from './transform/createExpression'

export const transform = (ast) => {
    const content: transformCtx = {
        currentNode: null, // 当前转换节点
        childIndex: 0, // 当前转换节点在父节点的children中的位置索引
        parent: null, // 当前转换节点的父节点
        nodeTransforms: [
            transformRoot,
            transformElement,
            transformText
        ],
        replaceNode(node, content) {
            // 节点替换功能
            content.currentNode = node
            content.parent.children[content.childIndex] = node
        },
        removeNode(node, content) {
            // 节点删除功能
            content.parent.children.splice(content.childIndex, 1)
            content.currentNode = null
        }
    }
    // 遍历节点并调用自定义方法 
    traverseNode(ast, content)


    console.log('\n****************transform转换后对应的ast结构****************\n');
    dump(ast);
    console.log(ast);
}


/** 输出 */
function dump(node, indent = 0) {
    const type = node.type || ''
    const desc = type === 'Root' ? '' : (type === 'Element' ? node.tag : node.content)
    console.log(`${'-'.repeat(indent)}${type}:${desc}`);
    if (node.children) {
        node.children.forEach(n => dump(n, indent + 2))
    }
}


/** 遍历节点 */
function traverseNode(ast: astNode, ctx: transformCtx) {
    ctx.currentNode = ast
    // 节点操作完成退出时执行的回调函数
    const existFns = []
    // do something start
    const transforms: Function[] = ctx.nodeTransforms  // nodeTransforms用来存放自定义的回调
    for (let i = 0; i < transforms.length; i++) {
        const callback = transforms[i](ctx.currentNode, ctx)
        if (callback && callback instanceof Function) {
            existFns.push(callback)
        }
        // 如果当前节点被移除了，则不进行后续操作
        if (!ctx.currentNode) break;
    }

    // do something end
    const children = ctx?.currentNode?.children
    if (children) {
        for (let i = 0; i < children?.length; i++) {
            ctx.parent = ctx.currentNode
            ctx.childIndex = i
            traverseNode(children[i], ctx)
        }
    }

    // 在子节点操作完成后，反序执行收集的回调函数
    let i = existFns.length
    while (i--) {
        existFns[i]()
    }
}

/** 生成对元素节点的 js描述 */
function transformElement(node: astNode, ctx: transformCtx) {
    // 放在退出阶段的回调中，确保该节点下的子节点均已处理完毕（已生成对应的jsNode描述）
    return () => {
        if (node.type !== 'Element') return

        // 对于节点而言，其对应的语句为  h('div', 'xxx' or [ ...] )  函数名：h  形参： 形参1 'tag名'   形参2  '子节点 或 文本'
        const callExp = createCallExpression('h', [createStringLiteral(node.tag)]) // h('div')
        node.children.length === 1
            // 单个子节点 （文本信息） -->  h('div', 'vue')
            ? callExp.arguments.push(node.children[0].jsNode)
            // 多个子节点   -->  h('div', [h(...)， 'xxx', ...])
            : callExp.arguments.push(
                createArrayExpression(node.children.map(i => i.jsNode))
            )

        node.jsNode = callExp

    }
}

/** 生成对文本节点的 js描述 */
function transformText(node: astNode, ctx: transformCtx) {
    if (node.type !== 'Text') return
    node.jsNode = createStringLiteral(node.content)

    // return () => {
    //     console.log(`${node.tag}-B-退出阶段执行`)
    // }
}

/** 生成根节点对应的渲染函数最外层的js描述 */
function transformRoot(node: astNode) {
    return () => {
        if (node.type !== 'Root') return

        // 仅考虑单个根节点的情况
        const vnodeJSAST = node.children[0].jsNode

        // 生成最外层的函数描述  function render() { return h(...) }
        node.jsNode = {
            type: 'FunctionDecl',
            id: createIdentifier('render'),
            body: [
                {
                    type: 'ReturnStatement',
                    return: vnodeJSAST
                }
            ]
        }
    }
}