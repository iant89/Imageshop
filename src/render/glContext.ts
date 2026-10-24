/**
 * WebGL2 context management with shader compilation helpers.
 */

import { BLEND_FRAGMENT_SHADER, VERTEX_SHADER } from '@/shaders';

export interface GlContext {
  canvas: OffscreenCanvas;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  locations: {
    aPosition: number;
    aTexCoord: number;
    uSource: WebGLUniformLocation;
    uDest: WebGLUniformLocation;
    uBlendMode: WebGLUniformLocation;
    uOpacity: WebGLUniformLocation;
  };
  quadBuffer: WebGLBuffer;
  texCoordBuffer: WebGLBuffer;
}

let shared: GlContext | null = null;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return shader;
}

export function initGl(canvas: OffscreenCanvas): GlContext {
  if (shared) return shared;
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true });
  if (!gl) throw new Error('WebGL2 context not available');

  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, BLEND_FRAGMENT_SHADER);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    throw new Error(`Program link failed: ${info}`);
  }

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
  const uSource = gl.getUniformLocation(program, 'uSource')!;
  const uDest = gl.getUniformLocation(program, 'uDest')!;
  const uBlendMode = gl.getUniformLocation(program, 'uBlendMode')!;
  const uOpacity = gl.getUniformLocation(program, 'uOpacity')!;

  // Fullscreen quad.
  const quadBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const texCoordBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), gl.STATIC_DRAW);

  shared = {
    canvas,
    gl,
    program,
    locations: { aPosition, aTexCoord, uSource, uDest, uBlendMode, uOpacity },
    quadBuffer,
    texCoordBuffer,
  };
  return shared;
}

export function getSharedGl(): GlContext | null {
  return shared;
}
