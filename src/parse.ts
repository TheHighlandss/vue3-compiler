const TextModes: TextModes = {
    DATA: 'DATA', // 初始状态，所有字符都按照其字面含义解析
    RCDATA: 'RCDATA', // 在该模式下，只有尖括号会被解析为标签，其他特殊字符不会被解析
    RAWTEXT: 'RAWTEXT', // 文本模式 ，通常用于显示代码或其他不需要进行解释或格式化的文本. 切换到 DATA 模式和 RCDATA 模式之外的模式时，一切字符都将作为文本节点被解析
    CDATA: 'CDATA'  // 针对xml
}

export const parse = (template: string): astNode => {
    const context: parseCtx = {
        source: template,
        mode: TextModes.DATA,
        advanceBy(num) {
            // 消费字符
            context.source = context.source.slice(num)
        },
        advanceSpaces() {
            // 匹配空白字符
            const match = /^[\t\r\n\f ]+/.exec(context.source)
            if (match) {
                context.advanceBy(match[0].length)
            }
        },
    }

    const nodes: tagElement[] = parseChildren(context, [])

    return {
        type: 'Root',
        children: nodes
    }
}

// ancestors - 节点栈（状态机栈），每遇到一个节点开始标签，就会将其压入栈中（同时开启一个状态机）；遇到该节点的结束标签，弹出栈（对应的状态机停止 ）。
function parseChildren(ctx: parseCtx, ancestors): tagElement[] {
    let nodes = [] // 存储子节点
    // const { source, mode } = ctx   // book: error position
    while (!isEnd(ctx, ancestors)) {
        const { source, mode } = ctx
        let node
        if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
            // 遇到 <xxx  or  <!-- xxx
            if (mode === TextModes.DATA && source[0] === '<') {
                // 注释 or CDATA
                if (source[1] === '!') {
                    // 解析注释
                    if (source.startsWith('<!--')) {
                        node = parseComment(ctx)
                    }
                    // 解析CDATA
                    // else if (source.startsWith('<![CDATA[')) {
                    //     node = parseCDATA(ctx, ancestors)
                    // }

                }
                // 遇到结束标签（在此时的DATA模式下仅遇到结束标签是错误的）
                else if (source[1] === '/') {
                    console.error('error end');
                }
                // 遇到正常的开始标签
                else if (/[a-zA-Z]/i.test(source[1])) {
                    node = parseElement(ctx, ancestors)
                }
            }
            // 遇到插值语法 {{ }}
            else if (source.startsWith('{{')) {
                node = parseInterpolation(ctx)
            }
        }

        if (!node) {
            node = parseText(ctx)
        }

        nodes.push(node)
    }

    return nodes
}

function isEnd(ctx: parseCtx, ancestors: any[]) {
    // 1.模板字符消耗完毕
    if (!ctx.source) return true

    // 2.栈中存在同名的结束标签，就停止状态机   todo: ?
    for (let i = ancestors.length - 1; i >= 0; i--) {
        if (ctx.source.startsWith(`</${ancestors[i].tag}`)) {
            return true
        }
    }

    return false
}


/** 解析标签节点 */
function parseElement(ctx: parseCtx, ancestors) {
    const element: tagElement = parseTag(ctx)
    if (element.isSelfClosing) return element

    if (element.tag === 'textarea' || element.tag === 'title') {
        ctx.mode = TextModes.RCDATA
    } else if (/style|xmp|iframe|noembed|noframes|noscript/.test(element.tag)) {
        ctx.mode = TextModes.RAWTEXT
    } else {
        ctx.mode = TextModes.DATA
    }

    ancestors.push(element)
    element.children = parseChildren(ctx, ancestors)
    ancestors.pop()  //  todo: ?


    if (ctx.source.startsWith(`</${element.tag}`)) {
        parseTag(ctx, 'end')
    } else {
        // console.error(`${element.tag} 缺少闭合标签`);
        throw new Error(`${element.tag} 缺少闭合标签`)

    }

    return element
}

/** 解析标签 */
function parseTag(ctx: parseCtx, type: 'start' | 'end' = 'start'): tagElement {
    const { advanceBy, advanceSpaces } = ctx
    /**
     * start:  /^<([a-z][^\t\r\n\f>/ ]*)/i.exec('<span disabled>asd')  =>  ['<span', 'span', index: 0,  ... ]
     * end:  /^<\/([a-z][^\t\r\n\f>/ ]*)/i.exec('</span>asd')  =>  ['</span', 'span', index: 0,  ... ]
     */
    const match = type === 'start'
        ? /^<([a-z][^\t\r\n\f>/ ]*)/i.exec(ctx.source)  // 匹配 <span id='asd'>xxxx 中的  <span
        : /^<\/([a-z][^\t\r\n\f>/ ]*)/i.exec(ctx.source)  // 匹配 </span>xxxx 中的  </span

    const tag = match[1]
    // 消费 <span
    advanceBy(match[0].length)
    // 消费空字符
    advanceSpaces()

    // 属性处理？
    const props = parseAttributes(ctx)

    const isSelfClosing = ctx.source.startsWith('/>')
    // 消费 /> or >
    advanceBy(isSelfClosing ? 2 : 1)

    return {
        type: 'Element',
        tag,
        props,
        children: [],
        isSelfClosing
    }
}

/** 解析属性 */
function parseAttributes(ctx: parseCtx): attributeItem[] {
    const { advanceBy, advanceSpaces } = ctx
    const props = []

    while (!(ctx.source.startsWith('>') || ctx.source.startsWith('/>'))) {
        const match = /^[^\t\r\n\f >/][^\t\r\n\f >/=]*/.exec(ctx.source)
        const name = match[0]
        advanceBy(name.length)
        advanceSpaces()
        advanceBy('='.length) // 消费等于号=
        advanceSpaces()

        let value = ''
        const quote = ctx.source[0] // 获取模板的第一个字符，看是否是引号 " or '
        const isQuote = quote === '"' || quote === "'"

        // 属性值有引号
        if (isQuote) {
            advanceBy(1)
            const endQuoteIndex = ctx.source.indexOf(quote)
            if (endQuoteIndex > -1) {
                value = ctx.source.slice(0, endQuoteIndex)
                advanceBy(value.length)  // 是否要考虑属性值前后的空格？
                advanceBy(1) // 消费结束引号
            } else {
                // console.error(`${name}属性值缺少结束引号`)
                throw new Error(`${name}属性值缺少结束引号`)

            }
        }
        // 属性值无引号
        else {
            const match = /^[^\t\r\n\f >/]+/.exec(ctx.source) // 到下一个空白字符前的内容作为属性值
            value = match[0]
            advanceBy(value.length)
        }

        advanceSpaces()
        props.push({
            type: 'Attribute',
            name,
            value,
        })
    }
    return props
}

/** 解析文本 */
function parseText(ctx: parseCtx) {
    let endIndex = ctx.source.length // 默认剩余内容全为文字
    const ltIndex = ctx.source.indexOf('<')  // xxx <
    const delimiterIndex = ctx.source.indexOf('{{')  // xxx {{
    if (ltIndex > -1 && ltIndex < endIndex) {
        endIndex = ltIndex
    }
    if (delimiterIndex > -1 && delimiterIndex < endIndex) {
        endIndex = delimiterIndex
    }

    const content = ctx.source.slice(0, endIndex)
    ctx.advanceBy(content.length)

    return {
        type: 'Text',
        content //  省略解析html实体 decodeHtml(content)
    }
}

/** 解析插值 */
function parseInterpolation(ctx: parseCtx) {
    const { advanceBy } = ctx
    advanceBy('{{'.length)
    const closeIndex = ctx.source.indexOf('}}')
    if (closeIndex < 0) {
        // console.error('缺少结束定界符 }} ');
        throw new Error('缺少结束定界符 }} ')
    }
    const content = ctx.source.slice(0, closeIndex)
    advanceBy(content.length)
    advanceBy('}}'.length)
    return {
        type: 'Interpolation',
        content: {
            type: 'Expression',
            content
        }
    }
}

/** 解析注释 */
function parseComment(ctx: parseCtx) {
    const { advanceBy } = ctx
    advanceBy('<!--'.length)
    const closeIndex = ctx.source.indexOf('-->')
    const content = ctx.source.slice(0, closeIndex)
    advanceBy(content.length)
    advanceBy('-->'.length)
    return {
        type: 'Comment',
        content
    }
}





/***  */

/** 是否是字母 */
// function isAlpha(char: string) {
//     return /^[a-zA-Z]$/.test(char)
// }

// // 状态机状态
// const STATE = {
//     initial: 1,
//     tagOpen: 2,
//     tagName: 3,
//     text: 4,
//     tagEnd: 5,
//     tagEndName: 6,
// }

// /** 模板标记化 */
// function tokenize(str: string): token[] {
//     let currentState = STATE.initial
//     const chars: string[] = []
//     const results: token[] = []
//     while (str) {
//         const char = str[0]
//         switch (currentState) {
//             // 初始状态： 寻找文本 or 寻找标签开始  （暂不考虑注释等情况）
//             case STATE.initial:
//                 if (char === '<') {
//                     currentState = STATE.tagOpen
//                     str = str.slice(1)
//                 } else if (isAlpha(char)) {
//                     currentState = STATE.text
//                     chars.push(char)
//                     str = str.slice(1)
//                 }
//                 break;


//             case STATE.tagOpen:
//                 if (isAlpha(char)) {
//                     currentState = STATE.tagName
//                     chars.push(char)
//                     str = str.slice(1)
//                 } else if (char === '/') {
//                     // 标签结束
//                     currentState = STATE.tagEnd
//                     str = str.slice(1)
//                 }
//                 break;

//             case STATE.tagName:
//                 if (isAlpha(char)) {
//                     chars.push(char)
//                     str = str.slice(1)
//                 } else if (char === '>') {
//                     // 起始标签结束
//                     currentState = STATE.initial
//                     results.push({
//                         type: 'tag',
//                         name: chars.join('')
//                     })
//                     chars.length = 0
//                     str = str.slice(1)
//                 }

//                 break;

//             case STATE.text:
//                 if (isAlpha(char)) {
//                     chars.push(char)
//                     str = str.slice(1)
//                 } else if (char === '<') {
//                     currentState = STATE.tagOpen
//                     results.push({
//                         type: 'text',
//                         content: chars.join('')
//                     })
//                     chars.length = 0
//                     str = str.slice(1)
//                 }
//                 break;

//             case STATE.tagEnd:
//                 if (isAlpha(char)) {
//                     currentState = STATE.tagEndName
//                     chars.push(char)
//                     str = str.slice(1)
//                 }
//                 break;

//             case STATE.tagEndName:
//                 if (isAlpha(char)) {
//                     chars.push(char)
//                     str = str.slice(1)
//                 } else if (char === '>') {
//                     // 标签结束
//                     currentState = STATE.initial
//                     results.push({
//                         type: 'tagEnd',
//                         name: chars.join('')
//                     })
//                     chars.length = 0
//                     str = str.slice(1)
//                 }
//                 break;
//         }
//     }

//     return results
// }

// /** 生成模板ast */
// function generateAST(tokens: token[]) {
//     const root = {
//         type: 'Root',
//         children: [],
//     }
//     // 创建ElementStack栈
//     const ElementStack = [root]
//     while (tokens.length) {
//         const topElement: astNode = ElementStack[ElementStack.length - 1]
//         const curToken = tokens[0]
//         switch (curToken.type) {
//             case 'tag':
//                 const elementNode = {
//                     type: 'Element',
//                     tag: curToken.name,
//                     children: []
//                 }
//                 topElement?.children?.push(elementNode)
//                 ElementStack.push(elementNode) // 只要有Push操作，下次循环进来topElement指向的就是当前这里被push的节点
//                 break;

//             case 'text':
//                 const textNode = {
//                     type: 'Text',
//                     content: curToken.content,
//                 }
//                 topElement?.children?.push(textNode)
//                 break;

//             case 'tagEnd':
//                 ElementStack.pop()
//                 break;
//         }
//         // 消费掉当前token
//         tokens.shift()
//     }
//     return root
// }


// /** 输出 */
// function dump(node, indent = 0) {
//     const type = node.type || ''
//     const desc = type === 'Root' ? '' : (type === 'Element' ? node.tag : node.content)
//     console.log(`${'-'.repeat(indent)}${type}:${desc}`);
//     if (node.children) {
//         node.children.forEach(n => dump(n, indent + 2))
//     }
// }
