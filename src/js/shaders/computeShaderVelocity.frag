#ifdef GL_ES
precision highp float;
#endif

uniform float time;


void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 tmpVel = texture2D( textureVelocity, uv );
  vec3 vel = tmpVel.xyz;

  gl_FragColor = vec4( vel.xyz, 1.0 );
}