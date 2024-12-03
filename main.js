// Importar librerías de Three.js y módulos necesarios
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
  // sound.play(); // No reproducir automáticamente
});

// Interfaz gráfica para ajustar la velocidad, reemplazar planetas y controlar la música
const gui = new GUI();
const options = {
  speed: 0.01,
  replacePlanets: false,
  playMusic: false,
};
gui.add(options, 'speed', 0.00, 1).name('Velocidad');
const replacePlanetsController = gui.add(options, 'replacePlanets').name('Reemplazar Planetas');
gui.add(options, 'playMusic').name('Reproducir Música');

// Variables para controlar la animación
let angle = 0;
let modelsLoaded = false;
let isLoading = false;
let previousReplacePlanets = options.replacePlanets;
let previousPlayMusic = options.playMusic;

// Cargar textura de fondo estelar
const loader = new THREE.TextureLoader();
const background_texture = loader.load('textures/2k_stars.jpg');
scene.background = background_texture;

// Arrays para planetas, tamaños, texturas, distancias y velocidades
const planets = [];
const modelPlanets = [];
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

// Cargar el modelo 3D para reemplazar los planetas
const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();

// Ruta a tus archivos .mtl y .obj
const mtlPath = 'Amaina-chan/ROOMITEMS015_ALL.mtl';
const objPath = 'Amaina-chan/ROOMITEMS015_ALL.obj';

// Contenedor para el mensaje de carga
const loadingDiv = document.createElement('div');
loadingDiv.style.position = 'absolute';
loadingDiv.style.top = '50%';
loadingDiv.style.left = '50%';
loadingDiv.style.transform = 'translate(-50%, -50%)';
loadingDiv.style.padding = '20px';
loadingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
loadingDiv.style.color = '#fff';
loadingDiv.style.fontSize = '20px';
loadingDiv.style.display = 'none'; // Oculto por defecto
loadingDiv.innerText = 'Cargando modelos 3D, por favor espera...';
document.body.appendChild(loadingDiv);

// Crear los planetas iniciales (esferas con texturas)
for (let i = 0; i < planetSizes.length; i++) {
  const geo = new THREE.SphereGeometry(planetSizes[i], 32, 32);
  const mat = new THREE.MeshLambertMaterial({ map: loader.load(textures[i]) });
  const mesh = new THREE.Mesh(geo, mat);
  
  if (i === 5) { // Saturno
    const ringGeometry = new THREE.RingGeometry(planetSizes[i] * 1.2, planetSizes[i] * 2.0, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: loader.load('textures/saturnRing.png'), // Textura del anillo con transparencia
      side: THREE.DoubleSide,
      transparent: true,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2; // Orientar el anillo en el plano correcto
    ringMesh.position.set(0, 0, 0); // Centrar el anillo
    mesh.add(ringMesh); // Añadir el anillo como hijo de Saturno
  }
  
  scene.add(mesh);
  planets.push(mesh);
}

// Añadir luz puntual en el centro (Sol)
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
function replacePlanets() {
  if (modelsLoaded) {
    // Mostrar modelos 3D y ocultar planetas originales
    for (let i = 0; i < planets.length; i++) {
      planets[i].visible = false;
      modelPlanets[i].visible = true;
    }
  } else if (!isLoading) {
    isLoading = true;
    loadingDiv.style.display = 'block'; // Mostrar mensaje de carga

    // Cargar y crear los modelos 3D para cada planeta
    for (let i = 0; i < planetSizes.length; i++) {
      mtlLoader.load(mtlPath, (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(objPath, (object) => {
          // Ajustar la escala del modelo según el tamaño deseado
          const scaleValue = planetSizes[i];
          object.scale.set(scaleValue, scaleValue, scaleValue);
          object.position.copy(planets[i].position);

          // Añadir el modelo a la escena y al array
          scene.add(object);
          modelPlanets.push(object);

          // Ocultar el modelo hasta que se active la opción
          object.visible = false;

          // Verificar si todos los modelos han sido cargados
          if (modelPlanets.length === planetSizes.length) {
            modelsLoaded = true;
            isLoading = false;
            loadingDiv.style.display = 'none'; // Ocultar mensaje de carga

            // Ocultar planetas originales y mostrar modelos 3D
            for (let j = 0; j < planets.length; j++) {
              planets[j].visible = false;
              modelPlanets[j].visible = true;
            }
          }
        });
      });
    }
  }
}

// Función para restaurar los planetas originales
function restorePlanets() {
  for (let i = 0; i < planets.length; i++) {
    planets[i].visible = true;
  }
  if (modelsLoaded) {
    for (let i = 0; i < modelPlanets.length; i++) {
      modelPlanets[i].visible = false;
    }
  }
}

// Función de animación
function animate() {
  requestAnimationFrame(animate);

  // Verificar cambios en `playMusic`
  if (options.playMusic !== previousPlayMusic) {
    if (options.playMusic) {
      sound.play();
    } else {
      sound.pause(); // Pausar la música
    }
    previousPlayMusic = options.playMusic;
  }

  // Verificar cambios en `replacePlanets`
  if (options.replacePlanets !== previousReplacePlanets) {
    if (options.replacePlanets) {
      replacePlanets();
    } else {
      restorePlanets();
    }
    previousReplacePlanets = options.replacePlanets;
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
  for (let i = 0; i < modelPlanets.length; i++) {
    if (modelPlanets[i].visible) {
      modelPlanets[i].position.x = distances[i] * Math.cos(angle * speeds[i]);
      modelPlanets[i].position.z = distances[i] * Math.sin(angle * speeds[i]);
      modelPlanets[i].rotation.y += 0.01;
    }
  }

  sun.rotation.y += -0.01 * options.speed;
  angle += options.speed;

  renderer.render(scene, camera);
}

animate();
