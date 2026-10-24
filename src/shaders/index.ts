/**
 * WebGL shader sources for the compositor.
 *
 * Blend modes run in the fragment shader, sampling the source layer texture
 * and the destination (already-composited) texture, then applying the
 * selected blend equation driven by the `uBlendMode` uniform.
 */

export const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
in vec2 aTexCoord;
out vec2 vTexCoord;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vTexCoord = aTexCoord;
}
`;

export const BLEND_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uSource;   // current layer texture
uniform sampler2D uDest;     // already-composited layers below
uniform int uBlendMode;      // blend mode enum
uniform float uOpacity;      // layer opacity
in vec2 vTexCoord;
out vec4 outColor;

// Blend mode enum (must mirror src/core/blendModes.ts)
const int BM_NORMAL = 0;
const int BM_MULTIPLY = 1;
const int BM_SCREEN = 2;
const int BM_OVERLAY = 3;
const int BM_SOFT_LIGHT = 4;
const int BM_HARD_LIGHT = 5;
const int BM_COLOR_DODGE = 6;
const int BM_COLOR_BURN = 7;
const int BM_DARKEN = 8;
const int BM_LIGHTEN = 9;
const int BM_DIFFERENCE = 10;
const int BM_EXCLUSION = 11;

float blendNormal(float s, float d) { return s; }
float blendMultiply(float s, float d) { return s * d; }
float blendScreen(float s, float d) { return 1.0 - (1.0 - s) * (1.0 - d); }
float blendOverlay(float s, float d) {
  return d < 0.5 ? 2.0 * s * d : 1.0 - 2.0 * (1.0 - s) * (1.0 - d);
}
float blendSoftLight(float s, float d) {
  return d < 0.5 ? (2.0 * s - 1.0) * d * d + d : d + (1.0 - d) * (0.5 - s) * (1.0 - (2.0 * s - 1.0) * (1.0 - d));
}
float blendHardLight(float s, float d) {
  return s < 0.5 ? 2.0 * s * d : 1.0 - 2.0 * (1.0 - s) * (1.0 - d);
}
float blendColorDodge(float s, float d) {
  if (s >= 1.0) return 1.0;
  if (d <= 0.0) return 0.0;
  return min(1.0, d / (1.0 - s));
}
float blendColorBurn(float s, float d) {
  if (s <= 0.0) return 0.0;
  if (d >= 1.0) return 1.0;
  return max(0.0, 1.0 - (1.0 - d) / s);
}
float blendDarken(float s, float d) { return min(s, d); }
float blendLighten(float s, float d) { return max(s, d); }
float blendDifference(float s, float d) { return abs(s - d); }
float blendExclusion(float s, float d) { return s + d - 2.0 * s * d; }

float blendChannel(int mode, float s, float d) {
  if (mode == BM_NORMAL) return blendNormal(s, d);
  if (mode == BM_MULTIPLY) return blendMultiply(s, d);
  if (mode == BM_SCREEN) return blendScreen(s, d);
  if (mode == BM_OVERLAY) return blendOverlay(s, d);
  if (mode == BM_SOFT_LIGHT) return blendSoftLight(s, d);
  if (mode == BM_HARD_LIGHT) return blendHardLight(s, d);
  if (mode == BM_COLOR_DODGE) return blendColorDodge(s, d);
  if (mode == BM_COLOR_BURN) return blendColorBurn(s, d);
  if (mode == BM_DARKEN) return blendDarken(s, d);
  if (mode == BM_LIGHTEN) return blendLighten(s, d);
  if (mode == BM_DIFFERENCE) return blendDifference(s, d);
  if (mode == BM_EXCLUSION) return blendExclusion(s, d);
  return blendNormal(s, d);
}

void main() {
  vec4 src = texture(uSource, vTexCoord);
  vec4 dst = texture(uDest, vTexCoord);

  // Premultiplied alpha blending: src over dst with blend applied to color.
  float sa = src.a;
  float da = dst.a;

  vec3 blended = vec3(0.0);
  if (sa > 0.0) {
    vec3 s = src.rgb;   // premultiplied
    vec3 d = dst.rgb;
    vec3 b = vec3(
      blendChannel(uBlendMode, s.r, d.r),
      blendChannel(uBlendMode, s.g, d.g),
      blendChannel(uBlendMode, s.b, d.b)
    );
    // Apply opacity to the blend amount.
    blended = mix(d, b, uOpacity * sa);
  } else {
    blended = d;
  }

  float outA = sa + da * (1.0 - sa);
  outColor = vec4(blended, outA);
}
`;
