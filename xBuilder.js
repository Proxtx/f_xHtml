export const build = (htmlObj, watchObj) => {
  return loop(new Utility(htmlObj, watchObj));
};

const loop = (utility) => {
  let result = [];
  while (utility.index < utility.htmlObj.length) {
    result.push(step(utility));
    try {
      utility.next();
    } catch (e) {
      break;
    }
  }
  return result;
};

const parsers = {
  html: (utility) => {
    if (utility.elem.type != "html") return;
    let node = document.createElement(utility.elem.tag);
    for (let i in utility.elem.attributes) {
      let attribute = utility.elem.attributes[i];
      let varListeners = [];
      for (let v in attribute.value) {
        if (attribute.value[v].type == "var") {
          varListeners.push(attribute.value[v].varName);
        }
      }
      utility.watchObj.watcher.addListener((operation) => {
        if (operation != "set") return;
        node.setAttribute(
          attribute.attribute,
          genText(attribute.value, utility.watchObj)
        );
      }, ...varListeners);
      node.setAttribute(
        attribute.attribute,
        genText(attribute.value, utility.watchObj)
      );
    }
    if (!utility.elem.innerHTML) return node;
    let childNodes = build(utility.elem.innerHTML, utility.watchObj);
    for (let i in childNodes) node.appendChild(childNodes[i]);
    return node;
  },

  text: (utility) => {
    let htmlObj = [];
    let varListeners = [];
    utility.do((utility) => {
      if (utility.elem.type == "var" || utility.elem.type == "text")
        htmlObj.push(utility.elem);
      else return true;
      if (utility.elem.type == "var") {
        varListeners.push(utility.elem.varName);
      }
    });
    if (!htmlObj.length) return;
    const node = document.createTextNode(genText(htmlObj, utility.watchObj));
    if (varListeners.length)
      utility.watchObj.watcher.addListener((operation) => {
        if (operation != "set") return;
        node.nodeValue = genText(htmlObj, utility.watchObj);
      }, ...varListeners);

    utility.next(-1);

    return node;
  },
};

const genText = (htmlObj, watchObj) => {
  let text = "";
  for (let i in htmlObj) {
    htmlObj[i].type == "text"
      ? (text += htmlObj[i].char)
      : (text += watchObj[htmlObj[i].varName]);
  }
  return text;
};

const step = (utility, ignore = []) => {
  let parserOrder = [parsers.html, parsers.text];
  for (let i in parserOrder) {
    if (ignore.includes(parserOrder[i])) continue;
    let result = parserOrder[i](utility);
    if (result || result === false) return result;
  }
};

class Utility {
  htmlObj;
  index = 0;
  watchObj;
  elem;

  constructor(htmlObj, watchObj) {
    this.htmlObj = htmlObj;
    this.watchObj = watchObj;
    this.elem = this.htmlObj[this.index];
  }

  next = (amount = 1) => {
    this.index += amount;
    if (this.index >= this.htmlObj.length)
      throw new Error(
        "Building Error. Something is trying to access an element over the limit."
      );
    return (this.elem = this.htmlObj[this.index]);
  };

  do = (job, first = false, last = false) => {
    first && this.next();
    while (!job(this)) {
      try {
        this.next();
      } catch (e) {
        last = false;
        break;
      }
    }
    last && this.next();
  };
}
