if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./src/sw.js");
  console.log("service worker yes")
} else {
  console.log("no service worker")
}

import './libs/jszip.min.js';
import { Pan, TwoFingerPan, Pinch, PointerListener } from './libs/contact.js';
import { Layer } from './src/layer.js';

//=================================================

let image = {
  height: 480,
  width: 480,
  layers: [],
  activeLayerIndex: null,
  lineWidth: 2,
  strokeStyle: "#000000",
  globalCompositeOperation: "source-over"
};

let activeLayer = null;
const canvasWrap = document.getElementById("canvas");
const canvas = document.createElement("canvas");
canvasWrap.appendChild(canvas);
canvas.height = image.height;
canvas.width = image.width;

let zoom = {
  center: {
    x: image.width / 2.0,
    y: image.height / 2.0
  },
  origin: {
    x: 0,
    y: 0
  },
  scale: 1.0,
  width: image.width,
  height: image.height,
}

//=================================================

function addLayer() {
  let index = image.layers.length;

  let layerButton = document.createElement('layer-control');
  layerButton.setAttribute("layer-id", index);

  layerButton.addEventListener("selectLayer", () => activateLayer(index));
  //layerButton.addEventListener("toggleLayer", () => toggleLayer(index));
  //layerButton.addEventListener("moveLayerUp", () => moveLayerUp(index));
  //layerButton.addEventListener("moveLayerDown", () => moveLayerDown(index));

  document
    .getElementById("layerMenu")
    .appendChild(layerButton);

  let layer = new Layer(image.width, image.height, index, layerButton);
  image.layers.push(layer);
  
  activateLayer(index);
  genThumbnail(layer);
}

function activateLayer(l) {
  image.activeLayerIndex = l;
  activeLayer = image.layers[l];
  let ctx = activeLayer.canvas.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = image.lineWidth;
  ctx.strokeStyle = image.strokeStyle;
  ctx.globalCompositeOperation = image.globalCompositeOperation;
}

document.getElementById("newLayerButton")
  .addEventListener("click", addLayer);

//=================================================

document.getElementById("inputColorPicker")
  .addEventListener("change", (ev) => {
    image.globalCompositeOperation = "source-over";
    image.strokeStyle = ev.target.value
    if (!activeLayer) return;
    activateLayer(image.activeLayerIndex);
  });

document.getElementById("inputPencilSize")
  .addEventListener("change", (ev) => {
    image.lineWidth = ev.target.value
    if (!activeLayer) return;
    activateLayer(image.activeLayerIndex);
  });

document.getElementById("buttonEraser")
  .addEventListener("click", (ev) => {
    image.globalCompositeOperation = "destination-out";
    activateLayer(image.activeLayerIndex);
  })
//=================================================

function exportImage() {
  let link = document.createElement('a');
  link.download = 'file' + Date.now() + '.png';
  link.href = canvas.toDataURL();
  link.click();
}
document.getElementById("exportButton").addEventListener("click", exportImage);

//=================================================

async function saveFile() {
  let layerData = [];
  let layerBlob = [];
  for(let layer of image.layers) {
    let data = await layer.toJSON();
    layerBlob.push(data.data);
    layerData.push({
      ...data,
      data: data.index + '.png'
    });
  }
  
  let imageData = {
    ...image,
    layers: layerData
  };
  
  const fzip = new JSZip();
  fzip.file("image.json", JSON.stringify(imageData));
  const folder = fzip.folder("layers");
  for(let blob in layerBlob) {
    folder.file(blob + ".png", layerBlob[blob]);
  }
  
  fzip.generateAsync({type:"blob"})
    .then(function(content) {
      let link = document.createElement('a');
      link.download = 'save' + Date.now() + '.zip';
      link.href = URL.createObjectURL(content);
      link.click();
    });
}
document.getElementById("saveButton").addEventListener("click", () => {
  saveFile();
});

async function openFile(file) {
  const fzip = await JSZip.loadAsync(file);
  let fimage = await fzip.file("image.json").async("string");
  fimage = JSON.parse(fimage);
  let layers = [];
  
  const folder = fzip.folder("layers");
  for(let flayer of fimage.layers) {
    let index = flayer.index;
    let layerButton = document.createElement('layer-control');
    layerButton.setAttribute("layer-id", index);
    
    layerButton.addEventListener("selectLayer", () => activateLayer(index));
    //layerButton.addEventListener("toggleLayer", () => toggleLayer(index));
    //layerButton.addEventListener("moveLayerUp", () => moveLayerUp(index));
    //layerButton.addEventListener("moveLayerDown", () => moveLayerDown(index));
    
    document
      .getElementById("layerMenu")
      .appendChild(layerButton);
    
    let layer = new Layer(fimage.width, fimage.height, index, layerButton);
    layers.push(layer);
    layer.globalCompositeOperation = flayer.globalCompositeOperation;
    
    let blob = await folder.file(flayer.data).async("blob");
    let bitmap = await createImageBitmap(blob);
    let ctx = layer.canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    
    let snap = URL.createObjectURL(blob);
    layer.control.setAttribute("src", snap);
  }
  
  image = {
    ...fimage,
    layers
  };
  
  activateLayer(fimage.activeLayerIndex);
}

document.getElementById("openFile").addEventListener("change", (ev) => {
  openFile(ev.target.files[0]);
});

document.getElementById("openButton").addEventListener("click", () => {
  document.getElementById("openFile").click()
});

//=================================================

function zoomedCoords(x, y) {
  return {
    x: Math.floor(x / zoom.scale + zoom.origin.x),
    y: Math.floor(y / zoom.scale + zoom.origin.y)
  };
}


function dragStart(ev) {
  if (!activeLayer) return;
  let ctx = activeLayer.canvas.getContext("2d");
  ctx.beginPath();
}

function drag(ev) {
  if (!activeLayer) return;
  let ctx = activeLayer.canvas.getContext("2d");
  let {x,y} = zoomedCoords(ev.offsetX, ev.offsetY);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function onZoom(scale, dscale, center) {
  let nscale = scale * dscale;
  if(Math.abs(nscale - 1.0) < 0.1) {
    nscale = 1.0;
    center = {
      x: image.width / 2.0,
      y: image.height / 2.0
    }
  }
  
  const si = 1.0 / nscale;
  const csi = 1.0 - si;
  zoom = {
    center,
    origin: {
      x: center.x * csi,
      y: center.y * csi
    },
    scale,
    width: image.width * si,
    height: image.height * si
  }
}

const options = {
  "supportedGestures": [
    Pan,
    TwoFingerPan,
    Pinch
  ]
}
const pointerListener = new PointerListener(canvas, options);
canvas.addEventListener("panstart", (ev) => {
  dragStart(ev.detail.global.srcEvent);
});
canvas.addEventListener("pan", (ev) => {
  drag(ev.detail.global.srcEvent);
});

canvas.addEventListener("twofingerpan", (ev) => {
  const p = ev.detail.live;
  onZoom(zoom.scale, 1, {
    x: zoom.center.x - (p.deltaX / zoom.scale),
    y: zoom.center.y - (p.deltaY / zoom.scale)
  });
});

canvas.addEventListener("pinchstart", (ev) => {});

canvas.addEventListener("pinch", (ev) => {
  const scale = ev.detail.global.scale;
  const p = ev.detail.global.center;
  onZoom(zoom.scale, scale, zoom.center);
})

canvas.addEventListener("pinchend", (ev) => {
  zoom.scale = zoom.scale * ev.detail.global.scale;
  onZoom(zoom.scale, 1.0, zoom.center);
});


//=================================================

function collapseLayers(canvas, zoom) {
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, image.width, image.height);

  //ctx.imageSmoothingQuality = "high";
  ctx.imageSmoothingEnabled = false;
  
  for (let layer of image.layers) {
    ctx.globalCompositeOperation = layer.globalCompositeOperation;
    ctx.drawImage(
      layer.canvas,
      zoom.origin.x, zoom.origin.y, zoom.width, zoom.height,
      0, 0, image.width, image.height);
  }
}

function genThumbnail(layer) {
  return layer
      .canvas
      .convertToBlob({
        type: "image/webp",
        quality: 0.1
      })
      .then(blob => {
        let snap = URL.createObjectURL(blob);
        layer.control.setAttribute("src", snap);
        return true;
      });
}

function updateLayer() {
  collapseLayers(canvas, zoom);
  if (activeLayer)
    genThumbnail(activeLayer).then(() =>
      requestAnimationFrame(updateLayer));
  else 
    requestAnimationFrame(updateLayer);
}
requestAnimationFrame(updateLayer);

//=================================================