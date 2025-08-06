#include <versionPrecision>
#include <gBufferOut>
#include <packNormal>
#include <getMotionVector>

// COPY EXACT TERRAIN APPROACH - just change color to blue for flood
in vec2 vUv;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform PerMaterial {
    mat4 projectionMatrix;
    float u_time;
};

uniform sampler2D u_floodData;

void main() {
    float waterDepth = texture(u_floodData, vUv).r;

    // Only render where there's actual flood water
    if (waterDepth < 0.001) {
        discard;
    }

    // COPY EXACT water rendering from terrain.frag (lines 202-214)
    // but use flood-specific blue color

    // Simple upward normal for water surface
    vec3 waterNormal = vec3(0, 1, 0);

    // GeoTwin: Flood water color (muddy blue-brown like user requested)
    vec3 baseWaterColor = vec3(0.2, 0.35, 0.5);
    vec3 muddyTint = vec3(0.4, 0.3, 0.2);
    vec3 floodWaterColor = mix(baseWaterColor, muddyTint, 0.3);

    // Use EXACT same G-buffer outputs as terrain water
    outColor = vec4(floodWaterColor, 0.7);
    outGlow = vec3(0);
    outNormal = packNormal(waterNormal);
    outRoughnessMetalnessF0 = vec3(0.05, 0, 0.03);
    outMotion = getMotionVector(vClipPos, vClipPosPrev);
    outObjectId = 0u;
}
