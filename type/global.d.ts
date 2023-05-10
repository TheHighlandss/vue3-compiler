declare interface token {
    type: string
    name?: string
    content?: string
}

declare interface astNode {
    type: string
    tag?: string
    children?: astNode[]
    content?: string
    jsNode?: astJsNode
}

declare interface transformCtx {
    currentNode: null | astNode
    childIndex: number,
    parent: null | astNode,
    nodeTransforms: Function[]
    replaceNode: (a: astNode, b: transformCtx) => void;
    removeNode: (a: astNode, b: transformCtx) => void;
    [key: string]: unknown
}

declare interface astJsNode {
    type?: string
    name?: string
    value?: string
    elements?: astJsNode[]
    callee?: string
    arguments?: astJsNode[]
    id?: { type: string, name: string }
    params?: astJsNode[]
    body?: astJsNode[]
    return?: astJsNode
}

declare interface generateCtx {
    code: string
    push: (a: string) => void
    currentIndent: number
    newLine: () => void
    indent: () => void
    deIndent: () => void
}