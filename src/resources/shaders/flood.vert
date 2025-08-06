#include <versionPrecision>

in vec3 position;
in vec2 uv;
in float textureId;

out vec2 vUv;
out float vTextureId;
out vec3 vPosition;
out vec4 vClipPos;
out vec4 vClipPosPrev;
out vec3 vCenter;

uniform PerMesh {
	mat4 modelViewMatrix;
	mat4 modelViewMatrixPrev;
	vec4 transformNormal0;
	vec4 transformNormal1;
	float terrainRingSize;
	vec4 terrainRingOffset;
	int terrainLevelId;
	float segmentCount;
	vec2 cameraPosition;
	vec2 detailTextureOffset;
};

uniform PerMaterial {
	mat4 projectionMatrix;
	float time;
};

uniform sampler2DArray tRingHeight;

void main() {
	vUv = uv;
	vTextureId = textureId;

	vec2 terrainUV = (position.xz - terrainRingOffset.xy) / terrainRingSize;
	float height = texelFetch(tRingHeight, ivec3(terrainUV * segmentCount + 0.5 / segmentCount, terrainLevelId), 0).r;

	vec3 transformedPosition = position.xyz + vec3(0, height, 0);
	vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
	vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

	vPosition = vec3(cameraSpacePosition);
	vClipPos = projectionMatrix * cameraSpacePosition;
	vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;

	vCenter = vec3(0.5) - abs(uv.xyx - 0.5);

	gl_Position = vClipPos;
}
