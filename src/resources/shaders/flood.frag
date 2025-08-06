#include <versionPrecision>
#include <gBufferOut>
#include <packNormal>
#include <getMotionVector>

in vec2 vUv;
in float vTextureId;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;
in vec3 vCenter;

uniform PerMaterial {
	mat4 projectionMatrix;
	float time;
};

uniform sampler2DArray tMap;
uniform sampler2DArray tNormal;
uniform sampler2D tWaterNormal;
uniform sampler2D tWaterNoise;
uniform sampler2D u_floodData; // GeoTwin: Flood data texture for transparency

float edgeFactor() {
	vec3 d = fwidth(vCenter.xyz);
	vec3 a3 = smoothstep(vec3(0), d * 1.5, vCenter.xyz);
	return min(min(a3.x, a3.y), a3.z);
}

void main() {
	// GeoTwin: Sample flood data texture for transparency
	float waterDepth = texture(u_floodData, vUv).r;
	
	// If there is no water at this pixel, discard it so the terrain shows through
	if (waterDepth < 0.01) {
		discard;
	}

	if (edgeFactor() > 0.9) {
		//discard;
	}

	// GeoTwin: Special glossy flood water rendering (textureId = 255)
	if (vTextureId > 254.5) {
		// Enhanced flood water with glossy surface
		vec2 waterUV1 = vUv * 8.0 + vec2(time * 0.03, time * 0.02);
		vec2 waterUV2 = vUv * 12.0 + vec2(-time * 0.02, time * 0.035);
		
		vec3 waterNormal1 = texture(tWaterNormal, waterUV1).rgb * 2.0 - 1.0;
		vec3 waterNormal2 = texture(tWaterNormal, waterUV2).rgb * 2.0 - 1.0;
		vec3 combinedNormal = normalize(waterNormal1 + waterNormal2 * 0.5);
		
		float noise = texture(tWaterNoise, vUv * 4.0 + time * 0.01).r;
		
		vec3 floodWaterColor = vec3(0.15, 0.35, 0.55) + noise * 0.1;
		
		outColor = vec4(floodWaterColor, 0.8);
		outGlow = vec3(0.05, 0.1, 0.15);
		outNormal = packNormal(combinedNormal);
		outRoughnessMetalnessF0 = vec3(0.02, 0.0, 0.04);
		outMotion = getMotionVector(vClipPos, vClipPosPrev);
		outObjectId = 0u;
		return;
	}

	// Standard water rendering (textureId = 0)
	if (vTextureId < 0.5) {
		vec2 waterUV1 = vUv * 6.0 + vec2(time * 0.02, time * 0.015);
		vec2 waterUV2 = vUv * 9.0 + vec2(-time * 0.015, time * 0.025);
		
		vec3 waterNormal1 = texture(tWaterNormal, waterUV1).rgb * 2.0 - 1.0;
		vec3 waterNormal2 = texture(tWaterNormal, waterUV2).rgb * 2.0 - 1.0;
		vec3 combinedNormal = normalize(waterNormal1 + waterNormal2 * 0.3);
		
		float noise = texture(tWaterNoise, vUv * 3.0 + time * 0.008).r;
		
		vec3 waterColor = vec3(0.1, 0.3, 0.5) + noise * 0.05;
		
		outColor = vec4(waterColor, 0.7);
		outGlow = vec3(0);
		outNormal = packNormal(combinedNormal);
		outRoughnessMetalnessF0 = vec3(0.05, 0, 0.03);
		outMotion = getMotionVector(vClipPos, vClipPosPrev);
		outObjectId = 0u;
		return;
	}

	// Regular textured surfaces
	int textureIndex = int(vTextureId);
	vec4 albedo = texture(tMap, vec3(vUv, textureIndex));
	vec3 normal = texture(tNormal, vec3(vUv, textureIndex)).rgb * 2.0 - 1.0;

	outColor = albedo;
	outGlow = vec3(0);
	outNormal = packNormal(normal);
	outRoughnessMetalnessF0 = vec3(0.8, 0, 0.04);
	outMotion = getMotionVector(vClipPos, vClipPosPrev);
	outObjectId = 0u;
}
