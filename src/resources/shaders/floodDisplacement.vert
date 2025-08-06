#include <versionPrecision>

// COPY EXACT TERRAIN APPROACH - just for flood areas
in vec3 position;
in vec2 uv;

out vec2 vUv;
out vec3 vPosition;
out vec4 vClipPos;
out vec4 vClipPosPrev;

uniform PerMesh {
    mat4 modelViewMatrix;
    mat4 modelViewMatrixPrev;
    float terrainRingSize;
    vec4 terrainRingOffset;
    int terrainLevelId;
    float segmentCount;
};

uniform PerMaterial {
    mat4 projectionMatrix;
    float u_time;
};

// Use EXACT same terrain height texture as terrain.vert
uniform sampler2DArray tRingHeight;
uniform sampler2D u_floodData;

void main() {
    vUv = uv;

    // COPY EXACT terrain height sampling from terrain.vert
    float height = texelFetch(tRingHeight, ivec3(uv * segmentCount + 0.5 / segmentCount, terrainLevelId), 0).r;

    // Add flood depth on top of terrain
    float floodDepth = texture(u_floodData, uv).r;

    // Use EXACT same transformation as terrain
    vec3 transformedPosition = position.xyz + vec3(0, height + floodDepth, 0);
    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
    vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

    vPosition = vec3(cameraSpacePosition);
    vClipPos = projectionMatrix * cameraSpacePosition;
    vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

    gl_Position = vClipPos;
}