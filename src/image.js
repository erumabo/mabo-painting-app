export class Image {
  constructor(height, width) {
    this.height = height;
    this.width = width;
    this.layers = [];
    this.activeLayerIndex = null;
    this.lineWidth = 2;
    this.strokeStyle = "#000000";
    this.globalCompositeOperation = "source-over";
  }
  
  async toJSON() {
    let layerData = [];
    for(let l of this.layers) layerData.push(await l.toJSON());
    let blobs = layerData.map(l => ({blob: l.blob, filename: l.data}));
    return {
      height: this.height,
      width: this.width,
      layers: layerData.map(l => ({...l, blob: undefined})),
      blobs,
      activeLayerIndex: this.activeLayerIndex,
      lineWidth: this.lineWidth,
      strokeStyle: this.strokeStyle,
      globalCompositeOperation: this.globalCompositeOperation
    };
  }
  
}