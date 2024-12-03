import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

// Configuración básica de la escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);

camera.position.set(0, 200, 0);
camera.rotation.x = -Math.PI / 2;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
document.body.appendChild(renderer.domElement);

// Controles de órbita
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

// Configurar el audio
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('assets/SpaceSound.mp3', (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(true); 
  sound.setVolume(0.5);
});

// Interfaz para ajustar la velocidad, reemplazar planetas y música
const gui = new GUI();
const options = {
  speed: 0.01,
  reemplazarPlaneta: false,
  playMusic: false,
};
gui.add(options, 'speed', 0.00, 1).name('Velocidad');
const replacePlanetsController = gui.add(options, 'reemplazarPlaneta').name('Reemplazar Planetas');
gui.add(options, 'playMusic').name('Reproducir Música');

// Variables para controlar la animación
let angle = 0;
let Modelocargado = false;
let estaCargando = false;
let planetaorigen = options.reemplazarPlaneta;
let PrevMusic = options.playMusic;

// Cargar fondo
const loader = new THREE.TextureLoader();
const background_texture = loader.load('textures/2k_stars.jpg');
scene.background = background_texture;

// Arrays
const planets = [];
const ModeloPlaneta = [];
const planetSizes = [0.39, 0.95, 1, 0.53, 11, 9.1, 3.9, 4];
const textures = [
  'textures/2k_mercury.jpg',
  'textures/2k_venus_surface.jpg',
  'textures/2k_earth_daymap.jpg',
  'textures/2k_mars.jpg',
  'textures/2k_jupiter.jpg',
  'textures/2k_saturn.jpg',
  'textures/2k_uranus.jpg',
  'textures/2k_neptune.jpg'
];
const distances = [20, 35, 50, 75, 110, 140, 170, 190];
const speeds = [0.2, 0.1, 0.05, 0.04, 0.01, 0.008, 0.006, 0.004];

// Cargar el modelo 3D 
const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();

//.mtl y .obj
const mtlPath = 'Amaina-chan/ROOMITEMS015_ALL.mtl';
const objPath = 'Amaina-chan/ROOMITEMS015_ALL.obj';

// Crear los planetas
for (let i = 0; i < planetSizes.length; i++) {
  const geo = new THREE.SphereGeometry(planetSizes[i], 32, 32);
  const mat = new THREE.MeshLambertMaterial({ map: loader.load(textures[i]) });
  const mesh = new THREE.Mesh(geo, mat);
  
  if (i === 5) { // Saturno
    const ringGeometry = new THREE.RingGeometry(planetSizes[i] * 1.2, planetSizes[i] * 2.0, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: loader.load('textures/saturnRing.png'),
      side: THREE.DoubleSide,
      transparent: true,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2; // Orientar el anillo en el plano
    ringMesh.position.set(0, 0, 0); // Centrar el anillo
    mesh.add(ringMesh); // Añadir el anillo
  }
  
  scene.add(mesh);
  planets.push(mesh);
}

// Añadir luz puntual en el centro 
const light = new THREE.PointLight(0xffe9b1, 10000, 1000);
light.position.set(0, 0, 0);
scene.add(light);

// Crear el Sol
const sunGeo = new THREE.SphereGeometry(15, 32, 32);
const sunMat = new THREE.MeshStandardMaterial({
  map: loader.load('textures/2k_sun.jpg'),
  emissive: 0xf08f2a,
  emissiveMap: loader.load('textures/2k_sun.jpg'),
  emissiveIntensity: 1.5,
});
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Función para reemplazar los planetas con el modelo 3D
function reemplazarPlaneta() {
  if (Modelocargado) {
    for (let i = 0; i < planets.length; i++) {
      planets[i].visible = false;
      ModeloPlaneta[i].visible = true;
    }
  } else if (!estaCargando) {
    estaCargando = true;

    //Cargar planeta y modelo
    for (let i = 0; i < planetSizes.length; i++) {
      mtlLoader.load(mtlPath, (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(objPath, (object) => {
          // Ajustar la escala
          const scaleValue = planetSizes[i];
          object.scale.set(scaleValue, scaleValue, scaleValue);
          object.position.copy(planets[i].position);

          // Añadir el modelo al array
          scene.add(object);
          ModeloPlaneta.push(object);

          // Ocultar el modelo hasta que se active
          object.visible = false
          if (ModeloPlaneta.length === planetSizes.length) {
            Modelocargado = true;
            estaCargando = false;
            loadingDiv.style.display = 'cargando';

            for (let j = 0; j < planets.length; j++) {
              planets[j].visible = false;
              ModeloPlaneta[j].visible = true;
            }
          }
        });
      });
    }
  }
}

//restaurar los planetas
function restPlanetas() {
  for (let i = 0; i < planets.length; i++) {
    planets[i].visible = true;
  }
  if (Modelocargado) {
    for (let i = 0; i < ModeloPlaneta.length; i++) {
      ModeloPlaneta[i].visible = false;
    }
  }
}

// Función de animación
function animate() {
  requestAnimationFrame(animate);

  if (options.playMusic !== PrevMusic) {
    if (options.playMusic) {
      sound.play();
    } else {
      sound.pause(); // Pausa
    }
    PrevMusic = options.playMusic;
  }

  // Verificar cambios en `reemplazarPlaneta`
  if (options.reemplazarPlaneta !== planetaorigen) {
    if (options.reemplazarPlaneta) {
      reemplazarPlaneta();
    } else {
      restPlanetas();
    }
    planetaorigen = options.reemplazarPlaneta;
  }

  // Animar planetas originales
  for (let i = 0; i < planets.length; i++) {
    if (planets[i].visible) {
      planets[i].position.x = distances[i] * Math.cos(angle * speeds[i]);
      planets[i].position.z = distances[i] * Math.sin(angle * speeds[i]);
      planets[i].rotation.y += 0.01;
    }
  }

  // Animar modelos 3D de planetas
  for (let i = 0; i < ModeloPlaneta.length; i++) {
    if (ModeloPlaneta[i].visible) {
      ModeloPlaneta[i].position.x = distances[i] * Math.cos(angle * speeds[i]);
      ModeloPlaneta[i].position.z = distances[i] * Math.sin(angle * speeds[i]);
      ModeloPlaneta[i].rotation.y += 0.01;
    }
  }

  sun.rotation.y += -0.01 * options.speed;
  angle += options.speed;

  renderer.render(scene, camera);
}

animate();
