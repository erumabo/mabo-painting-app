export class Layer {
  constructor(width, height, index, control) {
    this.canvas = new OffscreenCanvas(width, height);
    this.control = control;
    this.globalCompositeOperation = "souce-over";
    this.index = index;
    
    this.control
      .addEventListener("changeComposite", (ev) => {
        console.log(this.globalCompositeOperation = ev.detail)
      })
  }
  
  toggleView() {
    
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