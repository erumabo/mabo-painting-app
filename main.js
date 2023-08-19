if("serviceWorker"in navigator){navigator.serviceWorker.register("./src/sw.js")}

import './libs/jszip.min.js';
//import './components/dropdown-menu.js';
import './components/modal-menu.js';
import './components/layer-control.js';
import { Pan, TwoFingerPan, Pinch, PointerListener, Tap } from './libs/contact.js';
import iro from "./libs/iro.es.js";
import { Layer } from './src/layer.js';
import { Image } from './src/image.js';

//=================================================

let image = null,
    canvasWrap = null,
    canvas = null,
    activeLayer = null,
    zoom = null,
    originalZoom = null;

canvasWrap = document.getElementById("canvas");
canvas = document.createElement("canvas");
canvasWrap.appendChild(canvas);
canvas.height = canvasWrap.offsetHeight;
canvas.width = canvasWrap.offsetWidth;

function createImage(width, height) {
  image = new Image(width, height);
  
  zoom = {
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
  
  zoom.scale = Math.min(
    canvas.width / zoom.width,
    canvas.height / zoom.height);
  
  originalZoom = zoom;
  
  onZoom(zoom.scale, {
    x: image.width / 2,
    y: image.height / 2
  });
}

window.addEventListener('resize', _ =>
  setTimeout(_ => {
    if(!canvas) return;
    canvas.height = canvasWrap.offsetHeight;
    canvas.width = canvasWrap.offsetWidth;
  }));



//=================================================

function addLayer() {
  let index = image.layers.length;

  let layerButton = document.createElement('layer-control');
  layerButton.setAttribute("layer-id", index);

  layerButton.addEventListener("selectLayer", () => activateLayer(index));
  //layerButton.addEventListener("toggleLayer", () => toggleLayer(index));
  //layerButton.addEventListener("moveLayerUp", () => moveLayerUp(index));
  //layerButton.addEventListener("moveLayerDown", () => moveLayerDown(index));
  
  let li = document.createElement("li");
  li.appendChild(layerButton);
  document
    .getElementById("layerMenu")
    .appendChild(li)

  let layer = new Layer(image.width, image.height, index, layerButton);
  image.layers.push(layer);
  
  activateLayer(index);
  genThumbnail(layer);
}

function activateLayer(l) {
  image.activeLayerIndex = l;
  activeLayer = image.layers[l];
  setLayerStyle();
}

function setLayerStyle() {
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
    if (activeLayer) setLayerStyle();
  });

document.getElementById("inputPencilSize")
  .addEventListener("change", (ev) => {
    image.lineWidth = ev.target.value
    if (activeLayer) setLayerStyle();
  });

document.getElementById("buttonEraser")
  .addEventListener("click", (ev) => {
    image.globalCompositeOperation = "destination-out";
    if (activeLayer) setLayerStyle();
  })

function getPixel(pixelData, x, y) {
  if (x < 0 || y < 0 || x >= pixelData.width || y >= pixelData.height) {
    return -1;  // impossible color
  } else {
    return pixelData.data[y * pixelData.width + x];
  }
}

function bucketFill(ox,oy) {
  let {x,y} = zoomedCoords(ox, oy);
  const ctx = activeLayer.canvas.getContext("2d");
  
  // read the pixels in the canvas
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // make a Uint32Array view on the pixels so we can manipulate pixels
  // one 32bit value at a time instead of as 4 bytes per pixel
  const pixelData = {
    width: imageData.width,
    height: imageData.height,
    data: new Uint32Array(imageData.data.buffer),
  };
  
  // get the color we're filling
  const targetColor = getPixel(pixelData, x, y);
  let fillHex = 'ff' + image.strokeStyle
    .replace("#", '')
    .match(/.{1,2}/g)
    .reverse()
    .join('');
  const fillColor = parseInt(fillHex, 16);
  
  if(fillColor == targetColor) return;
  
  let ticks = 0;
  const points = [{x,y}];
  while(points.length > 0) {
    let point = points.pop();
    
    let pointColor = getPixel(pixelData, point.x, point.y);
    if(pointColor > -1 && pointColor == targetColor) {
      pixelData.data[point.y * pixelData.width + point.x] = fillColor;
      points.push({x: point.x-1, y: point.y})
      points.push({x: point.x+1, y: point.y})
      points.push({x: point.x,   y: point.y-1})
      points.push({x: point.x,   y: point.y+1})
      ticks++;
      if(ticks >= 50) {
        ctx.putImageData(imageData, 0, 0);
        ticks -= 50;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
  
document.getElementById("buttonBucket")
  .addEventListener("click", (ev) => {
    image.globalCompositeOperation = "source-over";
    if (activeLayer) {
      setLayerStyle();
      image.bucketFill = true;
    }
  })

const colorPicker = new iro.ColorPicker("#colorPicker");

//=================================================

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
  let imageData = await image.toJSON();
  let layerBlob = imageData.blobs;
  imageData.blobs = undefined;
  
  const fzip = new JSZip();
  fzip.file("image.json", JSON.stringify(imageData));
  const folder = fzip.folder("layers");
  for(let blob of layerBlob) {
    folder.file(blob.filename, blob.blob);
  }
  
  fzip.generateAsync({type:"blob"})
    .then(function(content) {
      let link = document.createElement('a');
      link.download = 'save' + Date.now() + '.zip';
      link.href = URL.createObjectURL(content);
      link.click();
    });
}
document.getElementById("saveButton")
        .addEventListener("click", saveFile);

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
  
  image = new Image(fimage.width, fimage.height);
  image.layers = layers;
  image.activeLayerIndex = fimage.activeLayerIndex;
  image.lineWidth = fimage.lineWidth;
  image.strokeStyle = fimage.strokeStyle;
  image.globalCompositeOperation = fimage.globalCompositeOperation;
  
  activateLayer(image.activeLayerIndex);
}

document.getElementById("openFile").addEventListener("change", (ev) => {
  openFile(ev.target.files[0]);
});

document.getElementById("openButton").addEventListener("click", () => {
  document.getElementById("openFile").click()
});

//=================================================

const coords = {
  zoomToScreen({x, y}){ 
    return {
      x: x * zoom.scale,
      y: y * zoom.scale
    }
  },
  screenToZoom({x, y}) {
    return {
      x: x / zoom.scale,
      y: y / zoom.scale
    }
  },
  zoomedToImage({x, y}) {
    return {
      x: x + zoom.origin.x,
      y: y + zoom.origin.y
    }
  },
  imageToZoomed({x,y}) {
    return {
      x: x - zoom.origin.x,
      y: y - zoom.origin.y
    }
  },
  newZoomOrigin(s, s1, s2, origin) {
    //m_x = m_x + x/s - 0.5*viewSize_x/s
    //m_y = m_y + y/s - 0.5*viewSize_y/s
    return {
      x: origin.x + s.x / s2 - 0.5 * zoom.width/s2,
      y: origin.y + s.y / s2 - 0.5 * zoom.height/s2
    }
    /*return {
      x: origin.x - s.x / s1 + s.x / s2,
      y: origin.y - s.y / s1 + s.y / s2
    }*/
  }
}

function zoomedCoords(x, y) {
  return coords.zoomedToImage(
      coords.screenToZoom({x,y}));
}

function canvasTap(ev) {
  if (!activeLayer) return;
  let ctx = activeLayer.canvas.getContext("2d");
  if(image.bucketFill) {
    image.bucketFill = false;
    bucketFill(ev.offsetX, ev.offsetY);
  }
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

function onZoom(nscale, center) {
  //let nscale = scale * dscale;
  if(Math.abs(nscale - 1.0) < 0.1) {
    nscale = 1.0;
    center = {
      x: 0,
      y: 0
    }
  }
  
  const si = 1.0 / zoom.scale;
  const nsi = 1.0 / nscale;
  let origin = coords.newZoomOrigin(
      center, 
      originalZoom.scale, nscale,
      originalZoom.origin
    );
  
  zoom = {
    center,
    origin: {
      x: (origin.x + zoom.origin.x) / 2,
      y: (origin.y + zoom.origin.y) / 2
    },
    scale: zoom.scale,
    width: canvas.width * nsi,
    height: canvas.height * nsi
  }
}

const options = {
  "supportedGestures": [
    Pan,
    TwoFingerPan,
    Pinch,
    Tap
  ]
}
const pointerListener = new PointerListener(canvas, options);
canvas.addEventListener("tap", (ev) => {
  canvasTap(ev.detail.global.srcEvent);
});

canvas.addEventListener("panstart", (ev) => {
  dragStart(ev.detail.global.srcEvent);
});
canvas.addEventListener("pan", (ev) => {
  drag(ev.detail.global.srcEvent);
});

canvas.addEventListener("twofingerpan", (ev) => {
  const p = ev.detail.live;
  if(zoom.scale > 1) {
    onZoom(zoom.scale, {
      x: zoom.center.x - (p.deltaX / (zoom.scale * zoom.scale)),
      y: zoom.center.y - (p.deltaY / (zoom.scale * zoom.scale))
    });
  } else {
    onZoom(zoom.scale, {
      x: zoom.center.x + (p.deltaX * (zoom.scale * zoom.scale)),
      y: zoom.center.y + (p.deltaY * (zoom.scale * zoom.scale))
    });
  }
});

canvas.addEventListener("pinchstart", (ev) => {
  originalZoom = zoom;
});

canvas.addEventListener("pinch", (ev) => {
  const scale = ev.detail.global.scale;
  const p = ev.detail.global.center;
  onZoom(originalZoom.scale * scale, p);
})

canvas.addEventListener("pinchend", (ev) => {
  zoom.scale = originalZoom.scale * ev.detail.global.scale;
  onZoom(zoom.scale, ev.detail.global.center);
});


//=================================================

function collapseLayers(canvas, zoom) {
  if(!image) return;
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.imageSmoothingQuality = "high";
  //ctx.imageSmoothingEnabled = false;
  
  for (let layer of image.layers) {
    if(layer.visible) {
      ctx.globalCompositeOperation = layer.globalCompositeOperation;
      ctx.drawImage(
        layer.canvas,
        zoom.origin.x, zoom.origin.y, zoom.width, zoom.height,
        0, 0, canvas.width, canvas.height);
    }
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

createImage(300,300);

//=================================================


