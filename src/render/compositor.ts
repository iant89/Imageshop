/**
 * Compositor — GPU layer compositing via WebGL2.
 *
 * Renders a stack of layers bottom-to-top into a framebuffer using blend-mode
 * shaders, then presents to a canvas. Layer pixel data comes from LayerBuffers
 * (which are tile-backed). In this milestone the full document is composited
 * per change; per-tile dirty-rect rendering is wired in the tile cache and
 * will incrementally replace full-document renders (see roadmap).
 */

import { BlendModeEnum } from '@/core/blendModes';
import { LayerBuffer } from '@/core/layerBuffer';
import type { Layer } from '@/core/document';
import { initGl, type GlContext } from './glContext';

function createTexture(gl: WebGL2RenderingContext, width: number, height: number): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function createFramebuffer(gl: WebGL2RenderingContext, texture: WebGLTexture): WebGLFramebuffer {
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Framebuffer not complete');
  }
  return fb;
}

function uploadTexture(gl: WebGL2RenderingContext, tex: WebGLTexture, imageData: ImageData) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
}

export interface CompositorOptions {
  width: number;
  height: number;
}

export class Compositor {
  private ctx!: GlContext;
  private width: number;
  private height: number;
  private sourceTex!: WebGLTexture;
  private destA!: { tex: WebGLTexture; fb: WebGLFramebuffer };
  private destB!: { tex: WebGLTexture; fb: WebGLFramebuffer };
  private initialized = false;

  constructor({ width, height }: CompositorOptions) {
    this.width = width;
    this.height = height;
    this.init();
  }

  private init() {
    const canvas = new OffscreenCanvas(this.width, this.height);
    this.ctx = initGl(canvas);
    // ensure ctx typed as GlContext (initGl returns GlContext)
    this.sourceTex = createTexture(this.ctx.gl, this.width, this.height);
    const texA = createTexture(this.ctx.gl, this.width, this.height);
    const texB = createTexture(this.ctx.gl, this.width, this.height);
    this.destA = { tex: texA, fb: createFramebuffer(this.ctx.gl, texA) };
    this.destB = { tex: texB, fb: createFramebuffer(this.ctx.gl, texB) };
    this.initialized = true;
  }

  resize(width: number, height: number) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.initialized = false;
    this.init();
  }

  /**
   * Composite the given layers into the compositor's offscreen canvas.
   * `getBuffer` resolves a LayerBuffer for a layer id.
   */
  composite(getBuffer: (layerId: string) => LayerBuffer | null, layers: Layer[]) {
    const { gl } = this.ctx;
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.ctx.program);

    // Attribute setup.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ctx.quadBuffer);
    gl.enableVertexAttribArray(this.ctx.locations.aPosition);
    gl.vertexAttribPointer(this.ctx.locations.aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ctx.texCoordBuffer);
    gl.enableVertexAttribArray(this.ctx.locations.aTexCoord);
    gl.vertexAttribPointer(this.ctx.locations.aTexCoord, 2, gl.FLOAT, false, 0, 0);

    // Clear dest A to transparent black.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.destA.fb);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let readFb = this.destA;
    let writeFb = this.destB;

    // Bind dest texture to texture unit 1.
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, readFb.tex);
    gl.uniform1i(this.ctx.locations.uDest, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.ctx.locations.uSource, 0);

    for (const layer of layers) {
      if (!layer.visible) continue;
      const buffer = getBuffer(layer.id);
      if (!buffer) continue;
      const imageData = buffer.getImageData();
      if (!imageData) continue;

      uploadTexture(gl, this.sourceTex, imageData);

      gl.bindFramebuffer(gl.FRAMEBUFFER, writeFb.fb);
      gl.uniform1i(this.ctx.locations.uBlendMode, blendModeFor(layer.blendMode));
      gl.uniform1f(this.ctx.locations.uOpacity, layer.opacity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Swap.
      const tmp = readFb;
      readFb = writeFb;
      writeFb = tmp;
    }

    // Present the final result (readFb holds the last written dest) to the offscreen canvas.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // To present, draw readFb.tex to the default framebuffer with a simple copy shader.
    // Reuse blend program with uDest bound to readFb and uSource a 1x1 transparent texture.
    // Simpler: use gl.copy? Instead draw a quad reading only uDest.
    gl.bindTexture(gl.TEXTURE0, this.sourceTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.width,
      this.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8ClampedArray(this.width * this.height * 4)
    );
    gl.uniform1i(this.ctx.locations.uBlendMode, BlendModeEnum.Normal);
    gl.uniform1f(this.ctx.locations.uOpacity, 1);
    // readFb.tex is already bound to unit 1 from the loop (bind once more to be safe).
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, readFb.tex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** The offscreen canvas holding the composited result. */
  get canvas(): OffscreenCanvas {
    return this.ctx.canvas;
  }

  destroy() {
    const { gl, program, quadBuffer, texCoordBuffer } = this.ctx;
    gl.deleteTexture(this.sourceTex);
    gl.deleteTexture(this.destA.tex);
    gl.deleteTexture(this.destB.tex);
    gl.deleteFramebuffer(this.destA.fb);
    gl.deleteFramebuffer(this.destB.fb);
    gl.deleteProgram(program);
    gl.deleteBuffer(quadBuffer);
    gl.deleteBuffer(texCoordBuffer);
    this.initialized = false;
  }
}

function blendModeFor(mode: string): number {
  switch (mode) {
    case 'multiply': return BlendModeEnum.Multiply;
    case 'screen': return BlendModeEnum.Screen;
    case 'overlay': return BlendModeEnum.Overlay;
    case 'soft-light': return BlendModeEnum.SoftLight;
    case 'hard-light': return BlendModeEnum.HardLight;
    case 'color-dodge': return BlendModeEnum.ColorDodge;
    case 'color-burn': return BlendModeEnum.ColorBurn;
    case 'darken': return BlendModeEnum.Darken;
    case 'lighten': return BlendModeEnum.Lighten;
    case 'difference': return BlendModeEnum.Difference;
    case 'exclusion': return BlendModeEnum.Exclusion;
    case 'normal':
    default:
      return BlendModeEnum.Normal;
  }
}

// GlContext (from ./glContext) is used directly for the context handle.
