// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   game.js                                            :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: arissane <arissane@student.hive.fi>        +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/07/23 11:59:14 by arissane          #+#    #+#             //
//   Updated: 2025/07/24 11:32:04 by arissane         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// Camera
const camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 0, -15), scene);
camera.setTarget(BABYLON.Vector3.Zero());
camera.rotation = new BABYLON.Vector3(0, 0, 0);
camera.attachControl(canvas, false);
camera.inputs.clear(); // disable camera input

// Lighting
const ambient = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
ambient.intensity = 0.8;
ambient.diffuse = new BABYLON.Color3(1, 0.9, 0.6);

const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(0, -0.2, 1), scene);
sun.position = new BABYLON.Vector3(0, 0, -45);
sun.intensity = 0.8;
sun.diffuse = new BABYLON.Color3(1.0, 0.9, 0.7);

// enable shadows
sun.shadowMinZ = 1;
sun.shadowMaxZ = 100;

// Background
scene.clearColor = new BABYLON.Color3.Black();

// Materials
const warmYellow = BABYLON.Color3.FromHexString("#FFCC00");

const wallMaterial = new BABYLON.StandardMaterial("wallMat", scene);
wallMaterial.diffuseColor = warmYellow;

const paddleMaterial = new BABYLON.StandardMaterial("paddleMat", scene);
paddleMaterial.diffuseColor = warmYellow;

const ballMaterial = new BABYLON.StandardMaterial("ballMat", scene);
ballMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);

// Meshes
const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.4 }, scene);
ball.material = ballMaterial;

const paddle1 = BABYLON.MeshBuilder.CreateBox("paddle1", { width: 0.3, height: 2, depth: 0.3 }, scene);
const paddle2 = BABYLON.MeshBuilder.CreateBox("paddle2", { width: 0.3, height: 2, depth: 0.3 }, scene);
paddle1.material = paddle2.material = paddleMaterial;

// Mesh shadows
const shadowGenerator = new BABYLON.ShadowGenerator(1024, sun);
shadowGenerator.useBlurExponentialShadowMap = true;
shadowGenerator.blurKernel = 16;

shadowGenerator.addShadowCaster(paddle1);
shadowGenerator.addShadowCaster(paddle2);
shadowGenerator.addShadowCaster(ball);
ball.receiveShadows = true;

const wallThickness = 0.5;
const wallDepth = 0.2;
const fieldWidth = 100;

// Walls
const wallTop = BABYLON.MeshBuilder.CreateBox("wallTop", {
  width: fieldWidth,
  height: wallThickness,
  depth: wallDepth,
}, scene);
wallTop.position.y = 4.8;
wallTop.position.z = 0;
wallTop.material = wallMaterial;
wallTop.receiveShadows = true;

const wallBottom = wallTop.clone("wallBottom");
wallBottom.position.y = -4.8;

[wallTop, wallBottom].forEach(wall => {
  wall.material = wallMaterial;
  wall.receiveShadows = true;
});

// Define movement limits for walls, clamping at controls
const paddleHalfHeight = paddle1.getBoundingInfo().boundingBox.extendSize.y;
const wallHalfHeight   = wallTop.getBoundingInfo().boundingBox.extendSize.y;
const upperLimit = wallTop.position.y - wallHalfHeight - paddleHalfHeight;
const lowerLimit = wallBottom.position.y + wallHalfHeight + paddleHalfHeight;

// Particle texture
const particleTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png", scene);

let vx = 0.07, vy = 0.04, s1 = 0, s2 = 0;
let paused = true;

// UI
function updateScore() {
  document.getElementById("scoreBoard").textContent = `Player 1: ${s1} | Player 2: ${s2}`;
}

function resetBall() {
  ball.position.set(0, 0, 0);
  paused = true;
  ball.isVisible = true;
  vx = (Math.random() < 0.5 ? -1 : 1) * 0.07;
  vy = (Math.random() < 0.5 ? -1 : 1) * 0.04;
}

// Flash effect on paddle hit
function spawnFlash(position) {
  // particles
  const flash = new BABYLON.ParticleSystem("flash" + Math.random(), 30, scene);
  flash.particleTexture = particleTexture;
  flash.emitter = position.clone();
  flash.minEmitBox = BABYLON.Vector3.Zero();
  flash.maxEmitBox = BABYLON.Vector3.Zero();
  flash.color1 = warmYellow;
  flash.color2 = BABYLON.Color3.White();
  flash.minSize = 0.15;
  flash.maxSize = 0.3;
  flash.minLifeTime = 0.15;
  flash.maxLifeTime = 0.25;
  flash.emitRate = 1000;
  flash.gravity = new BABYLON.Vector3(0, 0, 0);
  flash.direction1 = new BABYLON.Vector3(-0.5, 0.3, 0.1);
  flash.direction2 = new BABYLON.Vector3(0.5, -0.3, -0.1);
  flash.manualEmitCount = 30;
  flash.disposeOnStop = true;
  flash.start();
  setTimeout(() => flash.stop(), 100);

  // light burst
  const light = new BABYLON.PointLight("flashLight" + Math.random(), position.clone(), scene);
  light.diffuse = new BABYLON.Color3(1, 0.9, 0.5);
  light.intensity = 2.0;
  light.range = 1;

  // Light fade out
  let fade = 1.0;
  const fadeInterval = setInterval(() => {
    fade -= 0.1;
    light.intensity = fade * 2;
    if (fade <= 0) {
      light.dispose();
      clearInterval(fadeInterval);
    }
  }, 30);

  // sound effect
  const paddleSound = new BABYLON.Sound("paddleHit", "https://cdn.jsdelivr.net/gh/anrisan/assets/audio/ping.mp3", scene, null, {
    autoplay: true,
    volume: 0.7,
    spatialSound: true,
    maxDistance: 10,
    refDistance: 1,
  });
  paddleSound.setPosition(position);
}

// Paddle position
paddle1.position.x = -6.5;
paddle2.position.x = 6.5;

// Game logic
scene.onBeforeRenderObservable.add(() => {
  if (paused) return;

  // Frame‐rate normalization
  const deltaFactor = engine.getDeltaTime() / (1000 / 60);
  const stepX       = vx * deltaFactor;
  const stepY       = vy * deltaFactor;
  const stepLength  = Math.hypot(stepX, stepY);
  if (stepLength === 0) return;

  // Build a swept‐sphere ray
  const origin = ball.position.clone();
  const dir    = new BABYLON.Vector3(stepX, stepY, 0).scale(1 / stepLength);
  const radius = ball.getBoundingInfo().boundingSphere.radius;
  const ray    = new BABYLON.Ray(origin, dir, stepLength + radius);

  // Collect all hits against our bounceable meshes
  const bounceables = [paddle1, paddle2, wallTop, wallBottom];
  const picks       = scene.multiPickWithRay(ray, mesh => bounceables.includes(mesh));

  if (picks.length) {
    // Find the closest hit
    picks.sort((a, b) => a.distance - b.distance);
    const pick = picks[0];
    if (pick.hit && pick.distance <= stepLength + radius) {
      // move up to the surface
      const travel    = Math.max(pick.distance - radius, 0);
      ball.position   = origin.add(dir.scale(travel));

      // reflect velocity around the surface normal
      const N   = pick.getNormal(true); // world‐space normal
      const V   = new BABYLON.Vector3(vx, vy, 0);
      const dot = BABYLON.Vector3.Dot(V, N);
      const R   = V.subtract(N.scale(2 * dot));
      vx = R.x; vy = R.y;

      spawnFlash(ball.position);

      // carry on the remaining distance
      const leftover = stepLength - travel;
      const newDir   = new BABYLON.Vector3(vx, vy, 0).normalize();
      ball.position = ball.position.add(newDir.scale(leftover));
    } else {
      // no valid hit within this frame’s travel
      ball.position = origin.add(dir.scale(stepLength));
    }
  } else {
    // No collision → simple move
    ball.position = origin.add(dir.scale(stepLength));
  }

  // Score
  if (ball.position.x < -9) { s2++; updateScore(); resetBall(); }
  if (ball.position.x >  9) { s1++; updateScore(); resetBall(); }
});

// Controls
window.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") paddle2.position.y += 0.3;
  if (e.key === "ArrowDown") paddle2.position.y -= 0.3;
  if (e.key === "w") paddle1.position.y += 0.3;
  if (e.key === "s") paddle1.position.y -= 0.3;

  // Clamp paddles between the walls
  paddle1.position.y = Math.min(Math.max(paddle1.position.y, lowerLimit), upperLimit);
  paddle2.position.y = Math.min(Math.max(paddle2.position.y, lowerLimit), upperLimit);

  if (e.code === "Space") paused = !paused;
});

engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());

updateScore();
resetBall();
