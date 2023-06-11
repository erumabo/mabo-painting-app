class LayerControl extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'layer-id'];
  }

  constructor() {
    super();
    let content = document.getElementById("layerControl").content;
    this
      .attachShadow({ mode: 'open' })
      .appendChild(content.cloneNode(true));
  }

  init() {
    const moveLayerUp = new Event("moveLayerUp");
    const moveLayerDown = new Event("moveLayerDown");
    const toggleLayer = new Event("toggleLayer");
    const selectLayer = new Event("selectLayer");

    const shadow = this.shadowRoot;
    shadow.querySelector("img")
      .addEventListener("click", () => this.dispatchEvent(selectLayer));
    shadow.querySelector(".layerToggleButton")
      .addEventListener("click", () => this.dispatchEvent(toggleLayer));

    this.setLayerLegend(this.hasAttribute("layer-id") ?
      this.getAttribute("layer-id") :
      "");

    if (this.hasAttribute("src"))
      this.setThumbnail(this.getAttribute("src"));

    const compositeOpts = [
      "source-over", "source-in", "source-out", "source-atop",
      "destination-over", "destination-in", "destination-out", "destination-atop",
      "lighter", "copy", "xor", "multiply", "screen",
      "overlay", "darken", "lighten", 
      "color-dodge", "color-burn",
      "hard-light", "soft-light",
      "difference", "exclusion",
      "hue", "saturation", "color", "luminosity"
    ];
    let select = this.shadowRoot.querySelector("select");
    let dft = true;
    for(let opt of compositeOpts) {
      let option = document.createElement("option");
      option.innerText = option.value = opt;
      if(dft) {
        option.select = true;
        dft = false;
      }
      select.appendChild(option);
    }
    select.addEventListener("change", (ev) => {
      this.dispatchEvent(new CustomEvent(
        "changeComposite",
        {
          detail: ev.target.value
        }));
    });
  }
  connectedCallback() { setTimeout(() => this.init()) }

  attributeChangedCallback(attr, v, o) {
    if (attr == "layer-id") this.setLayerLegend(v);
    else if (attr == "src") this.setThumbnail(v);
  }

  setLayerLegend(id) {
    this.shadowRoot
      .querySelector(".layerLegend")
      .innerText = id;
  }

  setThumbnail(src) {
    this.shadowRoot.querySelector("img").src = src;
  }
}


customElements.define("layer-control", LayerControl);