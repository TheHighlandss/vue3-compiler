const STATE = {
  initial: 1,
  tagOpen: 2,
  tagName: 3,
  text: 4,
  tagEnd: 5,
  tagEndName: 6
};
const parse = (template) => {
  const tokens = tokenize(template);
  console.log("\n****************template\u8F6C\u6362\u4E3Atokens****************\n", JSON.parse(JSON.stringify(tokens)));
  const ast = generateAST(tokens);
  console.log("\n****************tokens\u8F6C\u6362\u4E3Aast****************\n", ast);
  console.log("\n****************\u8F93\u51FAast\u5BF9\u5E94\u7684\u7ED3\u6784****************\n");
  dump$1(ast);
  return ast;
};
function isAlpha(char) {
  return /^[a-zA-Z]$/.test(char);
}
function tokenize(str) {
  let currentState = STATE.initial;
  const chars = [];
  const results = [];
  while (str) {
    const char = str[0];
    switch (currentState) {
      case STATE.initial:
        if (char === "<") {
          currentState = STATE.tagOpen;
          str = str.slice(1);
        } else if (isAlpha(char)) {
          currentState = STATE.text;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case STATE.tagOpen:
        if (isAlpha(char)) {
          currentState = STATE.tagName;
          chars.push(char);
          str = str.slice(1);
        } else if (char === "/") {
          currentState = STATE.tagEnd;
          str = str.slice(1);
        }
        break;
      case STATE.tagName:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === ">") {
          currentState = STATE.initial;
          results.push({
            type: "tag",
            name: chars.join("")
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      case STATE.text:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === "<") {
          currentState = STATE.tagOpen;
          results.push({
            type: "text",
            content: chars.join("")
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      case STATE.tagEnd:
        if (isAlpha(char)) {
          currentState = STATE.tagEndName;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case STATE.tagEndName:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === ">") {
          currentState = STATE.initial;
          results.push({
            type: "tagEnd",
            name: chars.join("")
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
    }
  }
  return results;
}
function generateAST(tokens) {
  const root = {
    type: "Root",
    children: []
  };
  const ElementStack = [root];
  while (tokens.length) {
    const topElement = ElementStack[ElementStack.length - 1];
    const curToken = tokens[0];
    switch (curToken.type) {
      case "tag":
        const elementNode = {
          type: "Element",
          tag: curToken.name,
          children: []
        };
        topElement?.children?.push(elementNode);
        ElementStack.push(elementNode);
        break;
      case "text":
        const textNode = {
          type: "Text",
          content: curToken.content
        };
        topElement?.children?.push(textNode);
        break;
      case "tagEnd":
        ElementStack.pop();
        break;
    }
    tokens.shift();
  }
  return root;
}
function dump$1(node, indent = 0) {
  const type = node.type || "";
  const desc = type === "Root" ? "" : type === "Element" ? node.tag : node.content;
  console.log(`${"-".repeat(indent)}${type}:${desc}`);
  if (node.children) {
    node.children.forEach((n) => dump$1(n, indent + 2));
  }
}

function createStringLiteral(value) {
  return {
    type: "StringLiteral",
    value
  };
}
function createIdentifier(name) {
  return {
    type: "Identifier",
    name
  };
}
function createArrayExpression(elements) {
  return {
    type: "ArrayExpression",
    elements
    // 数组中的元素
  };
}
function createCallExpression(callee, args) {
  return {
    type: "CallExpression",
    callee,
    // 描述被调用函数的名称
    arguments: args
    // 被调用函数的形参
  };
}

const transform = (ast) => {
  const content = {
    currentNode: null,
    // 当前转换节点
    childIndex: 0,
    // 当前转换节点在父节点的children中的位置索引
    parent: null,
    // 当前转换节点的父节点
    nodeTransforms: [
      transformRoot,
      transformElement,
      transformText
    ],
    replaceNode(node, content2) {
      content2.currentNode = node;
      content2.parent.children[content2.childIndex] = node;
    },
    removeNode(node, content2) {
      content2.parent.children.splice(content2.childIndex, 1);
      content2.currentNode = null;
    }
  };
  traverseNode(ast, content);
  console.log("\n****************transform\u8F6C\u6362\u540E\u5BF9\u5E94\u7684ast\u7ED3\u6784****************\n");
  dump(ast);
  console.log(ast);
};
function dump(node, indent = 0) {
  const type = node.type || "";
  const desc = type === "Root" ? "" : type === "Element" ? node.tag : node.content;
  console.log(`${"-".repeat(indent)}${type}:${desc}`);
  if (node.children) {
    node.children.forEach((n) => dump(n, indent + 2));
  }
}
function traverseNode(ast, ctx) {
  ctx.currentNode = ast;
  const existFns = [];
  const transforms = ctx.nodeTransforms;
  for (let i2 = 0; i2 < transforms.length; i2++) {
    const callback = transforms[i2](ctx.currentNode, ctx);
    if (callback && callback instanceof Function) {
      existFns.push(callback);
    }
    if (!ctx.currentNode)
      break;
  }
  const children = ctx?.currentNode?.children;
  if (children) {
    for (let i2 = 0; i2 < children?.length; i2++) {
      ctx.parent = ctx.currentNode;
      ctx.childIndex = i2;
      traverseNode(children[i2], ctx);
    }
  }
  let i = existFns.length;
  while (i--) {
    existFns[i]();
  }
}
function transformElement(node, ctx) {
  return () => {
    if (node.type !== "Element")
      return;
    const callExp = createCallExpression("h", [createStringLiteral(node.tag)]);
    node.children.length === 1 ? callExp.arguments.push(node.children[0].jsNode) : callExp.arguments.push(
      createArrayExpression(node.children.map((i) => i.jsNode))
    );
    node.jsNode = callExp;
  };
}
function transformText(node, ctx) {
  if (node.type !== "Text")
    return;
  node.jsNode = createStringLiteral(node.content);
}
function transformRoot(node) {
  return () => {
    if (node.type !== "Root")
      return;
    const vnodeJSAST = node.children[0].jsNode;
    node.jsNode = {
      type: "FunctionDecl",
      id: createIdentifier("render"),
      body: [
        {
          type: "ReturnStatement",
          return: vnodeJSAST
        }
      ]
    };
  };
}

const compiler = (template) => {
  const templateAST = parse(template);
  transform(templateAST);
  return templateAST;
};

export { compiler };
