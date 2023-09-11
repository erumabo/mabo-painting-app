import {Image} from './image.js';

export class Project {
  
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    this.image = new Image(width, height);
    
    this.activeLayer = null;
    this.zoom = null;
    this.originalZoom = null;
  }
  
  
}