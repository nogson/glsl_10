const hmr = require('../../lib/three-hmr')
const cache = hmr.cache(__filename)
const glslify = require('glslify')
// const EffectComposer = require('three-effectcomposer')(THREE);

const particlesVertex = glslify('./shaders/circle/vertexShader.vert');
const fragmentShader = glslify('./shaders/circle/fragmentShader.frag');

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let dpr = window.devicePixelRatio;

const CAMERA_DEPTH = 1024;
const PARTICLE_COUNT = Math.pow(2, 20);
const PARTICLE_TEXTURE_SIZE = Math.sqrt(PARTICLE_COUNT);
const PARTICLE_TEXTURE_RESOLUTION = new THREE.Vector2(
  window.innerWidth,
  window.innerHeight
);

//カメラ用のパラメーター
const PARTICLE_TEXTURE_RESOLUTION_HALF = PARTICLE_TEXTURE_RESOLUTION.clone().multiplyScalar(0.5);

//uniform用のベース設定
const SHADER_UNIFORMS_GLOBAL = {
  resolution: {
    value: PARTICLE_TEXTURE_RESOLUTION,
  },
  velocityMax: {
    value: Math.min(
			PARTICLE_TEXTURE_RESOLUTION.x,
			PARTICLE_TEXTURE_RESOLUTION.y
		) * 0.125,
  },
  colorBase: {
    value: new THREE.Color('hsl(245, 100%, 30%)'),
  },
  colorIntense: {
    value: new THREE.Color('hsl(15, 100%, 30%)'),
  },
  time: {
    value: 0,
  },
  delta: {
    value: 0,
  },
};

//オフスクリーンレンダリング用
var renderTarget = new THREE.WebGLRenderTarget(
  PARTICLE_TEXTURE_SIZE,
  PARTICLE_TEXTURE_SIZE,
  {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		stencilBuffer: false,
	}
);

//GPGPU用のテクスチャ切り替え？？
const textureBuffers = new (function () {
  this.in = renderTarget;
  this.out = renderTarget.clone();
  
  this.swap = () => {
    [this.in, this.out] = [this.out, this.in];
  };
});


module.exports = class Circle {
  constructor() {

    if (!THREE.Math.isPowerOfTwo(PARTICLE_TEXTURE_SIZE)) {
      throw new Error('Particle count should be a power of two.');
    }

    const geometry = this.createParticleGeometry();

    const material = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, SHADER_UNIFORMS_GLOBAL, {
        //オフスクリーンレンダリングしたWebGLRenderTargetをテクスチャとして渡す
        tData: { value: textureBuffers.in },
      }),

      vertexShader: particlesVertex,
      fragmentShader: particlesFragment,
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);


  }

  createParticleGeometry() {
    const vertices = new Float32Array(PARTICLE_COUNT * 3);

    //頂点データ
    for (let i = 0; i < vertices.length; i++) {
      vertices[i] = Math.random();
    }

    //UVデータ
    const uvs = new Float32Array(PARTICLE_COUNT * 2);

    for (let i = 0; i < uvs.length; i += 2) {
      const index = i / 2;
      uvs[i + 0] = (index % PARTICLE_TEXTURE_SIZE) / PARTICLE_TEXTURE_SIZE;
      uvs[i + 1] = Math.floor(index / PARTICLE_TEXTURE_SIZE) / PARTICLE_TEXTURE_SIZE;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.addAttribute(
      'position',
      new THREE.BufferAttribute(vertices, 3)
    );

    geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    return geometry;
  }

  getParticleData() {
    const data = new Float32Array(particleCount * 4);
    const getRandomValue = () => Math.random() - 0.5;

    for (let i = 0; i < data.length; i += 4) {
      const position = new THREE.Vector2(
        getRandomValue(),
        getRandomValue()
      );

      data[i + 0] = position.x;
      data[i + 1] = position.y;
    }

    const texture = new THREE.DataTexture(
      data, textureSize, textureSize,
      THREE.RGBAFormat,
      THREE.FloatType,
      THREE.Texture.DEFAULT_MAPPING,
      THREE.RepeatWrapping,
      THREE.RepeatWrapping,
      THREE.NearestFilter,
      THREE.NearestFilter
    );

    texture.needsUpdate = true;

    return texture;
  }

  getPlane(size) {
    const geometry = new THREE.PlaneGeometry(size.x, size.y, 1, 1);
    const material = new THREE.MeshBasicMaterial();

    return new THREE.Mesh(geometry, material);
  }
};



