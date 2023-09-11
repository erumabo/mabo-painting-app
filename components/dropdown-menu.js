class DropdownMenu extends HTMLElement {
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
    @import "./material-icons.css";
    @import "./style/theme.css";
    details {
      position: relative;
    }
    #body {
      position: absolute;
      z-index: 500;
      background: white;
      border: 1px inset grey;
      padding: 5px;
      margin-top: 5px;
    }
  </style>
  <details id="menu">
    <summary id="name" class="button primary">Summary</summary>
    <div id="body">
      <slot></slot>
    </div>
  </details>`;
}

customElements.define("dropdown-menu", DropdownMenu);