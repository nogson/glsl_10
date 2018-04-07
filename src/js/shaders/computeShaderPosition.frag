#ifdef GL_ES
precision highp float;
#endif
#pragma glslify: cnoise2 = require(glsl-noise/classic/2d)
#pragma glslify: cnoise3 = require(glsl-noise/classic/3d)


uniform float time;
uniform vec2 mouse;
uniform sampler2D resetPos;
//uniform bool isReset;

// For PI declaration:
// 現在の位置情報を決定する
#define delta ( 1.0 / 60.0 )

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 pos = tmpPos.xyz;

    pos.x += cos((time + pos.z + pos.y)) * 0.001;
    pos.y += sin((time + pos.z + pos.x)) * 0.003;
    pos.z += sin((time + pos.x + pos.y)) * 0.003;
   
    gl_FragColor = vec4( pos, 1.0 );
}
