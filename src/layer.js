export class Layer {
  constructor(width, height, index, control) {
    this.canvas = document.createElement("canvas");
    //this.canvas = new OffscreenCanvas(width, height);
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.convertToBlob = () => {
      return new Promise((resolve) => {
        this.canvas.toBlob(resolve);
      })
    }
    this.control = control;
    this.globalCompositeOperation = "souce-over";
    this.index = index;
    this.visible = true;
    
    this.control
      .addEventListener("changeComposite", (ev) => {
        console.log(this.globalCompositeOperation = ev.detail)
      })
    this.control
      .addEventListener("toggleLayer", ev => {
        this.visible = !this.visible;
      });
  }
  
  async toJSON() {
    return {
      data: this.index + ".png",
      blob: (await this.canvas.convertToBlob()),
      globalCompositeOperation: this.globalCompositeOperation,
      index: this.index
    };
  }
  
}