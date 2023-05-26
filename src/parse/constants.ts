export const TextModes: TextModes = {
    DATA: 'DATA',
    /**
     * 初始状态，所有字符都按照其字面含义解析，可以解析标签或HTML实体
     */

    RCDATA: 'RCDATA',
    /**
     * 在该模式下，标签内部所有的内容都按照字符来解释，如 <textarea>xxx</textarea>
     * 在遇到结束标签</textarea>前的所有内容都是按普通字符处理。但遇到&字符时会切换到字符引用状态
     * 也就是说，RCDATA模式支持解析HTML实体，但不支持解析标签
     */

    RAWTEXT: 'RAWTEXT',
    /**
     * 文本模式 ，通常用于显示代码或其他不需要进行解释或格式化的文本
     * 如遇到 <script> 标签时，就会切换为RAWTEXT模式
     */

    CDATA: 'CDATA'
    /**
     * 任何字符都当前普通字符处理，直到遇到CDATA的结束标签为止
     * 针对xml
     */
}