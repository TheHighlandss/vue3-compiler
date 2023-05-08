const STATE = {
    initial: 1,
    tagOpen: 2,
    tagName: 3,
    text: 4,
    tagEnd: 5,
    tagEndName: 6,
}

export const parse = (template) => {
    return tokenize(template)
}


function isAlpha(char: string) {
    return /^[a-zA-Z]$/.test(char)
}

function tokenize(str: string) {
    let currentState = STATE.initial
    const chars: string[] = []
    const results: {}[] = []
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
                        name: chars.join('')
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