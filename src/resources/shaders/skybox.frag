#include <versionPrecision>
#include <gBufferOut>

in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;

uniform samplerCube tSky;

uniform Uniforms {
    mat4 projectionMatrix;
    mat4 modelViewMatrix;
    mat4 viewMatrix;
    mat4 skyRotationMatrix;
};

#include <packNormal>
#include <gamma>

void main() {
    // GeoTwin: Static daytime sky - no stars or night elements
    outColor = vec4(0.5, 0.7, 1.0, 0); // Light blue daytime sky
    outGlow = vec3(0);
    outNormal = packNormal(vNormal);
    outRoughnessMetalnessF0 = vec3(0);
    outMotion = vec3(0);
    outObjectId = 0u;
}