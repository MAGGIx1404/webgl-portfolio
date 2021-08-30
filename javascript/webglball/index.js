class CameraController {
  constructor(camera) {
    this.bind();
    this.camera = camera;
    this.cursor = [0, 0];
    this.ease = 0.05;
    this.sensitivity = 0.001;

    RAF.subscribe("cameraControllerUpdate", this.update);
  }

  mouseMove(e) {
    this.cursor[0] = (e.clientX - window.innerWidth / 2) * this.sensitivity;
    this.cursor[1] = (e.clientY - window.innerHeight / 2) * this.sensitivity;
  }

  update() {
    this.camera.position.x +=
      (this.cursor[0] - this.camera.position.x) * this.ease;
    this.camera.position.y +=
      (this.cursor[1] - this.camera.position.y) * this.ease;

    this.camera.lookAt(0, 0, 0);
  }

  bind() {
    this.update = this.update.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    window.addEventListener("mousemove", this.mouseMove);
  }
}
const webglHolder = document.querySelector(".webglholder");
const SLICE_NUMBER = 40;
var simplex = new SimplexNoise();
let soundActor = 0.2;

const matCapsUrls = [
  "https://cdn.jsdelivr.net/gh/niccolomiranda/chiara-luzzana@72fab3c/sphere/matCap0.jpg",
];
let matCaps = [];
let loader = new THREE.TextureLoader();
matCapsUrls.forEach((url) => {
  matCaps.push(loader.load(url));
});

let colorPool = [new THREE.Color(0x822675)];
const GUIObj = {
  SLICE_NUMBER: SLICE_NUMBER,
  sliceThickness: 0.57,
  noiseSpeed: 4.3,
  noiseDetail: 30,
  noiseRoof: 2.3,
  noiseDepth: 0,
  noiseShadow: -0.8,
  noiseOffset: 2,
  matCap: 0,
  lightIntensity: 1.34,
  lightAmbient: 0,
  camSpeed: 0.05,
  camSensitivity: 0.002,
  highFreqIntensity: 0.0017 * 0.01,
  lowFreqIntensity: 0.008 * 0.1,
  colorChangingFrequency: 0.01,
};

class ThreeScene {
  constructor() {
    this.bind();

    this.camera;
    this.scene;
    this.renderer;
    this.controls;
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.debug.checkShaderErrors = true;
    webglHolder.appendChild(this.renderer.domElement);

    if (window.isMobile) this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 7);
    // var controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    this.camController = new CameraController(this.camera);

    let light = new THREE.AmbientLight();
    let pointLight = new THREE.PointLight();
    pointLight.position.set(10, 10, 0);
    this.scene.add(light, pointLight);

    this.textureLoader = new THREE.TextureLoader();

    // GENERATED SPHERE

    let sphereRad = 1;
    let fbxLoader = new THREE.FBXLoader();

    this.sliceGeom = new THREE.Group();

    fbxLoader.load(
      "https://cdn.jsdelivr.net/gh/niccolomiranda/chiara-luzzana/sphere/slice2.fbx",
      (obj) => {
        let inc = 0;
        for (
          let i = -sphereRad;
          i <= sphereRad;
          i += (sphereRad * 2) / SLICE_NUMBER
        ) {
          let n =
            ((simplex.noise2D(inc * 0.1, 1) + 1) / 2) * (colorPool.length - 1);
          n = Math.round(n);
          let uniforms = {
            u_tex: {
              value: this.testTex,
            },
            u_matCap: {
              value: matCaps[GUIObj.matCap],
            },
            u_nSpeed: {
              value: 0,
            },
            u_offset: {
              value: inc,
            },
            u_sliceNumber: {
              value: SLICE_NUMBER,
            },
            u_offsetInt: {
              value: GUIObj.noiseOffset,
            },
            u_color: {
              value: colorPool[n],
            },
            u_nDet: {
              value: GUIObj.noiseDetail,
            },
            u_nRoof: {
              value: GUIObj.noiseRoof,
            },
            u_nDepth: {
              value: GUIObj.noiseDepth,
            },
            u_nShadow: {
              value: GUIObj.noiseShadow,
            },
            u_lInt: {
              value: GUIObj.lightIntensity,
            },
            u_lTresh: {
              value: GUIObj.lightAmbient,
            },
          };

          let r = Math.sqrt(
            2 * sphereRad * (i + sphereRad) - Math.pow(i + sphereRad, 2)
          );

          if (r > 0) {
            let cyl = obj.children[0].clone();
            cyl.material = new THREE.ShaderMaterial({
              vertexShader: vertexShader(),
              fragmentShader: fragmentShader(),
              uniforms: uniforms,
              transparent: true,
            });

            this.initZScale = cyl.scale.z;
            cyl.position.y = i;
            cyl.scale.x *= r;
            cyl.scale.y *= r;
            cyl.scale.z = this.initZScale * GUIObj.sliceThickness;
            this.sliceGeom.add(cyl);
          }
          inc++;
        }

        this.sliceGeom.rotation.z = 1;
        this.sliceGeom.rotation.y = -0.8;
        this.scene.add(this.sliceGeom);
      }
    );
    if (window.isMobile) this.sliceGeom.scale.set(0.8, 0.8, 0.8);

    window.addEventListener("resize", this.resizeCanvas);
    RAF.subscribe("threeSceneUpdate", this.update);
  }

  update() {
    this.renderer.render(this.scene, this.camera);

    this.sliceGeom.children.forEach((child, i) => {
      let n =
        ((simplex.noise2D(i * GUIObj.colorChangingFrequency, 1) + 1) / 2) *
        (colorPool.length - 1);
      n = Math.round(n);

      child.scale.z = this.initZScale * GUIObj.sliceThickness;
      child.material.uniforms.u_nSpeed.value +=
        RAF.dt * 0.0001 * GUIObj.noiseSpeed * soundActor;
      child.material.uniforms.u_nDet.value = GUIObj.noiseDetail;
      child.material.uniforms.u_nRoof.value = GUIObj.noiseRoof;
      child.material.uniforms.u_nDepth.value = GUIObj.noiseDepth;
      child.material.uniforms.u_nShadow.value = GUIObj.noiseShadow;
      child.material.uniforms.u_matCap.value = matCaps[GUIObj.matCap];
      child.material.uniforms.u_lInt.value = GUIObj.lightIntensity;
      child.material.uniforms.u_lTresh.value = GUIObj.lightAmbient;
      child.material.uniforms.u_offsetInt.value = GUIObj.noiseOffset;

      child.material.uniforms.u_color.value = colorPool[n];

      if (soundReactor.audio == undefined) return;
      child.material.uniforms.u_nDet.value =
        GUIObj.noiseDetail + soundReactor.fdata[500] * GUIObj.highFreqIntensity;
      child.material.uniforms.u_nRoof.value =
        GUIObj.noiseRoof - soundReactor.fdata[10] * GUIObj.lowFreqIntensity;
      if (soundReactor.audio > 0 && !myAudio.paused) {
        soundActor = 1;
      } else {
        soundActor = 0.2;
      }
    });

    if (this.camController != undefined) {
      this.camController.sensitivity = GUIObj.camSensitivity;
      this.camController.ease = GUIObj.camSpeed;
    }
  }

  resizeCanvas() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  bind() {
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.update = this.update.bind(this);
    this.init = this.init.bind(this);
  }
}
const threeScene = new ThreeScene();
threeScene.init();
