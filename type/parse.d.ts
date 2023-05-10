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
    jsNode?: Record<string, any>
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