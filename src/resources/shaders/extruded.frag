#include <versionPrecision>
#include <gBufferOut>

// GeoTwin Color Palette - Warmer, more natural tones for flood risk assessment
#define WINDOW_GLOW_COLOR vec3(1.0, 0.85, 0.6)  // Warmer window glow
#define BUILDING_TINT_FACTOR 0.85  // Slightly muted building colors

in vec3 vColor;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
flat in int vTextureId;
flat in uint vObjectId;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
    uint tileId;
};

uniform PerMaterial {
    mat4 projectionMatrix;
};

uniform sampler2DArray tMap;
uniform sampler2D tNoise;

#include <packNormal>
#include <getMotionVector>
#include <getTBN>

vec4 getColorValue(int textureId, float mask, vec3 tintColor) {
    // Apply GeoTwin color adjustments for more natural building appearance
    vec3 baseColor = texture(tMap, vec3(vUv, textureId * 4)).rgb;

    // Warm up the colors slightly and reduce saturation for a more natural look
    baseColor = mix(baseColor, vec3(0.9, 0.85, 0.8), 0.1);

    vec3 color = mix(vec3(BUILDING_TINT_FACTOR), tintColor * BUILDING_TINT_FACTOR, mask);
    return vec4(baseColor * color, texture(tMap, vec3(vUv, textureId * 4)).a);
}

vec3 getMaskValue(int textureId) {
    return texture(tMap, vec3(vUv, textureId * 4 + 2)).xyz;
}

vec3 getGlowColor(int textureId) {
    return texture(tMap, vec3(vUv, textureId * 4 + 3)).xyz;
}

vec3 getNormalValue(int textureId) {
    mat3 tbn = getTBN(vNormal, vPosition, vec2(vUv.x, 1. - vUv.y));
    vec3 mapValue = texture(tMap, vec3(vUv, textureId * 4 + 1)).xyz * 2. - 1.;
    vec3 normal = normalize(tbn * mapValue);

    normal *= float(gl_FrontFacing) * 2. - 1.;

    return normal;
}

void main() {
    vec3 mask = getMaskValue(vTextureId);
    float noiseTextureWidth = vec2(textureSize(tNoise, 0)).r;

    // GeoTwin: No window lighting in static daytime environment
    float glowFactor = 0.0;

    outColor = getColorValue(vTextureId, mask.b, vColor);
    //outColor = vec4(fract(vUv), 0, 1);
    outGlow = getGlowColor(vTextureId) * WINDOW_GLOW_COLOR * glowFactor;
    outNormal = packNormal(getNormalValue(vTextureId));
    outRoughnessMetalnessF0 = vec3(mask.r, mask.g, 0.03);
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = vObjectId;
}