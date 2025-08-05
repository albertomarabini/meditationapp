import { NativeSyntheticEvent, ImageErrorEventData } from 'react-native';

export class MainScreenBackgroundImageManager {
  private imageReady: boolean;
  private backgroundSource: any;
  private readonly DEFAULT_BG: any;

  constructor(initialSource: any, defaultBg = require('../../assets/default-bg.jpg')) {
    this.DEFAULT_BG = defaultBg;
    this.backgroundSource = initialSource || defaultBg;
    this.imageReady = false;
  }

  getBackgroundSource(): any {
    return this.backgroundSource;
  }

  isImageReady(): boolean {
    return this.imageReady;
  }

  setBackgroundSource(source: any): void {
    this.backgroundSource = source || this.DEFAULT_BG;
    this.imageReady = false;
  }

  handleImageLoaded(): void {
    this.imageReady = true;
  }

  handleImageError(_event: NativeSyntheticEvent<ImageErrorEventData>): void {
    this.backgroundSource = this.DEFAULT_BG;
    this.imageReady = true;
  }
}
