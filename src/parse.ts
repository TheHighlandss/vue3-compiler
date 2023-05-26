import { TextModes } from './parse/constants'
import { parseElement, parseText, parseInterpolation, parseComment } from './parse/parseUtils'

export const parse = (template: string): astNode => {
    // 1. 创建上下文
    const context: parseCtx = {
        source: template,
        mode: TextModes.DATA,
        /** 消费指定长度的字符 */
        advanceBy(num) {
            context.source = context.source.slice(num)
        },
        /** 消费空白字符 */
        advanceSpaces() {
            const match = /^[\t\r\n\f ]+/.exec(context.source)
            if (match) {
                context.advanceBy(match[0].length)
            }
        },
    }

    // 2. 解析实体
    const nodes: tagElement[] = parseChildren(context, [])


    return {
        type: 'Root',
        children: nodes
    }
}

/**
 * 解析节点
 * @param ctx - 上下文
 * @param ancestors - 节点栈（状态机栈），每遇到一个节点开始标签，就会将其压入栈中（同时开启一个状态机）；遇到该节点的结束标签，弹出栈（对应的状态机停止 ）。
 * @returns 
 */
export function parseChildren(ctx: parseCtx, ancestors): tagElement[] {
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

        // node仍为空，则按照文本内容解析
        if (!node) {
            node = parseText(ctx)
        }

        nodes.push(node)
    }

    return nodes
}

/** 解析是否结束 */
function isEnd(ctx: parseCtx, ancestors: any[]) {
    // 1.模板字符消耗完毕
    if (!ctx.source) return true

    // 2.栈中存在同名的结束标签，就停止状态机
    for (let i = ancestors.length - 1; i >= 0; i--) {
        if (ctx.source.startsWith(`</${ancestors[i].tag}`)) {
            return true
        }
    }

    return false
}

