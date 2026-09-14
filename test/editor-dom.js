class FakeEl {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
  }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); return node; }
  setAttribute() {}
  addEventListener() {}
  remove() {}
  click() {}
  focus() {}
  select() {}
  contains() { return false; }
  closest() { return new FakeEl(); }
  querySelector() { return new FakeEl(); }
  querySelectorAll() { return []; }
  getBBox() { return { x: 0, y: 0, width: 10, height: 10 }; }
  get lastElementChild() { return this.children[this.children.length - 1] ?? null; }
}

export function installFakeDom() {
  const bySelector = new Map();
  globalThis.document = {
    querySelector(sel) {
      if (!bySelector.has(sel)) bySelector.set(sel, new FakeEl());
      return bySelector.get(sel);
    },
    querySelectorAll() { return []; },
    createElement(tag) { return new FakeEl(tag); },
    createElementNS(ns, tag) { return new FakeEl(tag); },
    addEventListener() {},
    elementsFromPoint() { return []; },
  };

  globalThis.window = globalThis;
  globalThis.window.parent = globalThis.window;

  globalThis.fetch = async () => ({ ok: false, status: 404 });
  return { $: (sel) => globalThis.document.querySelector(sel) };
}
