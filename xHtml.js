import { parse } from "./xParser.js";
import { build } from "./xBuilder.js";
import { watcher as watcherImport } from "./f_watcher/watcher.js";

export const watcher = watcherImport;

export const make = (string, watchObj) => {
  const htmlObj = parse(string);
  return build(htmlObj, watchObj);
};

export const load = async (file, watchObj) => {
  let text = await (await fetch(file)).text();
  return make(text, watchObj);
};

export const appendChildArray = (parent, childArray) => {
  for (let i in childArray) parent.appendChild(childArray[i]);
};

export let componentObj =
  window.componentObj && window.componentObj.watcher
    ? window.componentObj
    : watcher(window.componentObj ? componentObj : {});

const replaceXHTML = (watchObj, className = "component") => {
  let elements = document.getElementsByClassName(className);
  for (let i = 0; i < elements.length; i++) {
    let innerHTML = elements[i].innerHTML;
    elements[i].innerHTML = "";
    appendChildArray(elements[i], make(innerHTML, watchObj));
  }
};

replaceXHTML(componentObj);
