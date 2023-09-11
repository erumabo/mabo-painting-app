class ModalMenu extends HTMLElement {
  static get observedAttributes() {
    return ["name"];
  }

  constructor() {
    super();
    this
      .attachShadow({ mode: 'open' })
      .innerHTML = this.constructor.content;
  }

  toogle() {
    if (this.isOpen)
      this.dialog.close();
    else
      this.dialog.showModal();
  }

  open() {
    this.dialog.showModal();
  }

  close() {
    this.dialog.close();
  }

  init() {
    const shadow = this.shadowRoot;
    const self = this;
    this.isOpen = false;
    this.dialog = shadow.querySelector("dialog");

    if (this.hasAttribute("name"))
      this.updateName(this.getAttribute("name"));

    this.button = shadow.querySelector("#button");

    this.button
      .addEventListener("click", (ev) => {
        this.open();
      })

    this.dialog
      .addEventListener("click", (ev) => {
        if (ev.target === this.dialog) this.close();
      })
  }

  connectedCallback() {
    setTimeout(() => this.init());
  }

  attributeChangedCallback(attr, v, o) {
    switch (attr) {
      case "name":
        this.updateName(v);
        break;
    }
  }

  updateName(name) {
    this.shadowRoot
      .querySelector("#name")
      .innerText = name;

    this.shadowRoot
      .querySelector("#button")
      .innerText = name;
  }

  static content = `
  <style>
    @import "./material-icons.css";
    @import "./style/theme.css";
  </style>
  <button id="button" class="button primary">Menu</button>
  <dialog id="menu" class="modal">
    <form id="form" method="dialog">
        <h1 id="name">
          Menu
        </h1>
      <fieldset>
        <slot></slot>
      </fieldset>
    </form>
  </dialog>`;
}

customElements.define("modal-menu", ModalMenu);