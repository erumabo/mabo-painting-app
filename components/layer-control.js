class LayerControl extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'layer-id'];
  }

  constructor() {
    super();
    //let content = document.getElementById("layerControl").content;
    this
      .attachShadow({ mode: 'open' })
      .innerHTML = this.content;
    //  .appendChild(content.cloneNode(true));
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
    
    shadow.querySelector("fieldset").style["max-height"] = "fit-content";
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
  
  content = `<style>
    @import "./material-icons.css";
      fieldset {
        display: grid;
        grid-template-columns: 1fr 40px;
        grid-template-rows: 1fr 1fr 1.25em;
        grid-template-areas:
          "image toggle"
          "image delete"
          "image select";
        column-gap: 2px;
        row-gap: 2px;
        padding: 4px;
        min-height: 70px;
        overflow: clip;
        max-height: 0px;
      }
      img {
        grid-area: image;
        border: 1px solid gray;
      }
      .layerDeleteButton {
        grid-area: delete;
      }
      .layerToggleButton {
        grid-area: toggle;
      }
      .selectDropdown {
        grid-area: select;
      }
    </style>
      <fieldset class="layerOptions">
        <legend class="layerLegend"></legend>
        <img width="64" height="64" alt=""/>
        <button class="layerToggleButton">
          <span class="material-icons">
            visibility
          </span>
        </button>
        <button class="layerDeletrButton">
            <span class="material-icons">
              delete
            </span>
        </button>
        <select class="selectDropdown"></select>
      </fieldset>`;
}


customElements.define("layer-control", LayerControl);