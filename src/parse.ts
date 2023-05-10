const STATE = {
    initial: 1,
    tagOpen: 2,
    tagName: 3,
    text: 4,
    tagEnd: 5,
    tagEndName: 6,
}

export const parse = (template: string) => {
    const tokens = tokenize(template)
    console.log('\n****************template转换为tokens****************\n', tokens);
    const ast = generateAST(tokens)
    console.log('\n****************tokens转换为ast****************\n', ast);

    console.log('\n****************输出ast对应的结构****************\n');
    dump(ast)
    transform(ast)
    console.log('\n****************transform转换后对应的ast结构****************\n');
    dump(ast);
    return ast
}


function isAlpha(char: string) {
    return /^[a-zA-Z]$/.test(char)
}

/** 模板标记化 */
function tokenize(str: string): token[] {
    let currentState = STATE.initial
    const chars: string[] = []
    const results: token[] = []
    while (str) {
        const char = str[0]
        switch (currentState) {
            // 初始状态： 寻找文本 or 寻找标签开始  （暂不考虑注释等情况）
            case STATE.initial:
                if (char === '<') {
                    currentState = STATE.tagOpen
                    str = str.slice(1)
                } else if (isAlpha(char)) {
                    currentState = STATE.text
                    chars.push(char)
                    str = str.slice(1)
                }
                break;


            case STATE.tagOpen:
                if (isAlpha(char)) {
                    currentState = STATE.tagName
                    chars.push(char)
                    str = str.slice(1)
                } else if (char === '/') {
                    // 标签结束
                    currentState = STATE.tagEnd
                    str = str.slice(1)
                }
                break;

            case STATE.tagName:
                if (isAlpha(char)) {
                    chars.push(char)
                    str = str.slice(1)
                } else if (char === '>') {
                    // 起始标签结束
                    currentState = STATE.initial
                    results.push({
                        type: 'tag',
                        name: chars.join('')
                    })
                    chars.length = 0
                    str = str.slice(1)
                }

                break;

            case STATE.text:
                if (isAlpha(char)) {
                    chars.push(char)
                    str = str.slice(1)
                } else if (char === '<') {
                    currentState = STATE.tagOpen
                    results.push({
                        type: 'text',
                        content: chars.join('')
                    })
                    chars.length = 0
                    str = str.slice(1)
                }
                break;

            case STATE.tagEnd:
                if (isAlpha(char)) {
                    currentState = STATE.tagEndName
                    chars.push(char)
                    str = str.slice(1)
                }
                break;

            case STATE.tagEndName:
                if (isAlpha(char)) {
                    chars.push(char)
                    str = str.slice(1)
                } else if (char === '>') {
                    // 标签结束
                    currentState = STATE.initial
                    results.push({
                        type: 'tagEnd',
                        name: chars.join('')
                    })
                    chars.length = 0
                    str = str.slice(1)
                }
                break;
        }
    }

    return results
}

function generateAST(tokens: token[]) {
    const root = {
        type: 'Root',
        children: [],
    }
    // 创建ElementStack栈
    const ElementStack = [root]
    while (tokens.length) {
        const topElement: astNode = ElementStack[ElementStack.length - 1]
        const curToken = tokens[0]
        switch (curToken.type) {
            case 'tag':
                const elementNode = {
                    type: 'Element',
                    tag: curToken.name,
                    children: []
                }
                topElement?.children?.push(elementNode)
                ElementStack.push(elementNode) // 只要有Push操作，下次循环进来topElement指向的就是当前这里被push的节点
                break;

            case 'text':
                const textNode = {
                    type: 'Text',
                    content: curToken.content,
                }
                topElement?.children?.push(textNode)
                break;

            case 'tagEnd':
                ElementStack.pop()
                break;
        }
        // 消费掉当前token
        tokens.shift()
    }
    return root
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

/** 节点转换 */
function transform(ast) {
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