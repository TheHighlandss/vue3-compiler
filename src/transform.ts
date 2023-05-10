export const transform = (ast) => {
    const content: transformCtx = {
        currentNode: null, // 当前转换节点
        childIndex: 0, // 当前转换节点在父节点的children中的位置索引
        parent: null, // 当前转换节点的父节点
        nodeTransforms: [
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

function transformElement(node) {
    console.log(`${node.tag}-A-进入阶段执行`)
    // if (node.type === 'Element' && node.tag === 'p') {
    //     node.tag = 'h1'
    // }
    return () => {
        console.log(`${node.tag}-A-退出阶段执行`)
    }
}

function transformText(node: astNode, ctx: transformCtx) {
    console.log(`${node.tag}-B-进入阶段执行`)
    // if (node.type === 'Text') {
    //     node.content = node.content.repeat(2)
    //     // 替换节点测试
    //     // ctx.replaceNode({
    //     //     type: 'Element',
    //     //     tag: 'span'
    //     // }, ctx)

    //     // 删除节点测试
    //     // ctx.removeNode(node, ctx)
    // }

    return () => {
        console.log(`${node.tag}-B-退出阶段执行`)
    }
}