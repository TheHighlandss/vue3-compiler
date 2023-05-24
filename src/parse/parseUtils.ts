import { TextModes } from './constants'
import { parseChildren } from '../parse'

/** 解析标签节点 */
export function parseElement(ctx: parseCtx, ancestors) {
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
export function parseTag(ctx: parseCtx, type: 'start' | 'end' = 'start'): tagElement {
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
export function parseAttributes(ctx: parseCtx): attributeItem[] {
    const { advanceBy, advanceSpaces } = ctx
    const props = []

    while (!(ctx.source.startsWith('>') || ctx.source.startsWith('/>'))) {
        const match = /^[^\t\r\n\f >/][^\t\r\n\f >/=]*/.exec(ctx.source)
        const name = match[0]
        advanceBy(name.length)
        advanceSpaces()

        const iskeyValueAttribute = ctx.source.startsWith('=') // 是否是键值对类型的属性 （非布尔类型属性，如disabled）

        if (iskeyValueAttribute) {
            advanceBy('='.length) // 消费等于号=
            advanceSpaces()
        }

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
        // 属性值无引号 且是键值对类型的属性
        else if (iskeyValueAttribute) {
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
export function parseText(ctx: parseCtx) {
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
export function parseInterpolation(ctx: parseCtx) {
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
export function parseComment(ctx: parseCtx) {
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
