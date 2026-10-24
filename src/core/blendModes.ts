/**
 * Blend mode enum values mirrored from shaders/index.ts fragment shader.
 * Keep these in sync with the GLSL `BM_*` constants.
 */

export enum BlendModeEnum {
  Normal = 0,
  Multiply = 1,
  Screen = 2,
  Overlay = 3,
  SoftLight = 4,
  HardLight = 5,
  ColorDodge = 6,
  ColorBurn = 7,
  Darken = 8,
  Lighten = 9,
  Difference = 10,
  Exclusion = 11,
}

export function blendModeEnum(mode: import('@/core/document').BlendMode): BlendModeEnum {
  switch (mode) {
    case 'normal': return BlendModeEnum.Normal;
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
    // Remaining modes fall back to Normal in this milestone (see roadmap).
    case 'dissolve':
    case 'linear-dodge':
    case 'linear-burn':
    case 'vivid-light':
    case 'pin-light':
    case 'hard-mix':
    case 'hue':
    case 'saturation':
    case 'color':
    case 'luminosity':
    default:
      return BlendModeEnum.Normal;
  }
}
