export const TextModes: TextModes = {
    DATA: 'DATA', // 初始状态，所有字符都按照其字面含义解析
    RCDATA: 'RCDATA', // 在该模式下，只有尖括号会被解析为标签，其他特殊字符不会被解析
    RAWTEXT: 'RAWTEXT', // 文本模式 ，通常用于显示代码或其他不需要进行解释或格式化的文本. 切换到 DATA 模式和 RCDATA 模式之外的模式时，一切字符都将作为文本节点被解析
    CDATA: 'CDATA'  // 针对xml
}