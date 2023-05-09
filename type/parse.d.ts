declare interface token {
    type: string
    name?: string
    content?: string
}

declare interface astNode {
    type: string
    tag?: string
    children?: astNode[]
}

declare interface transformCtx {
    currentNode: null | astNode
    childIndex: number,
    parent: null | astNode,
    nodeTransforms: Function[]
    [key: string]: unknown
}