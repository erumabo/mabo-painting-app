export class DropdownMenu extends HTMLElement {
  static get observedAttributes() {
    return ["name"];
  }

  constructor() {
    super();
    this
      .attachShadow({ mode: 'open' })
      .innerHTML = this.content;
  }

  init() {
    const shadow = this.shadowRoot;
    const self = this;
    //this.addEventListener("focus", ()=>{});
    this.addEventListener("focusout", () => {
      setTimeout(() => {
        console.log("close")
        if(document.activeElement?.closest("dropdown-menu") == self)
          return
        shadow.querySelector("#menu").open = undefined;
      });
    });
    
    if (this.hasAttribute("name"))
      this.updateName(this.getAttribute("name"));

  }
  connectedCallback() { setTimeout(() => this.init()); }

  attributeChangedCallback(attr, v, o) {
    switch(attr) {
      case "name": this.updateName(v); break;
    }
  }
  
  updateName(name) {
    this.shadowRoot
      .querySelector("#name")
      .innerText = name;
  }
  
  content = `
  <style>
    details {
      position: relative;
      --max-width: 100px;
    }
    #body {
      position: absolute;
      z-index: 500;
    }
  </style>
  <details id="menu">
    <summary id="name">Summary</summary>
    <div id="body">
      <slot></slot>
    </div>
  </details>`;
}

customElements.define("dropdown-menu", DropdownMenu);