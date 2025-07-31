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

import { explodeBall, gatherBall, spawnFlash, flashPaddle } from './effects.js';
import { createScene } from './sceneSetup.js';
import { createObjects } from './objects.js';
import { createMaterials } from './materials.js';

const canvas = document.getElementById("renderCanvas");
const { engine, scene, sun, glow } = createScene(canvas);
const materials = createMaterials(scene);
const { ballMaterial, warmYellow } = materials;
const { ball, paddle1, paddle2, wallTop, wallBottom, floor, limits } = createObjects(scene, materials);
const { upperLimitZ, lowerLimitZ } = limits;

const flareTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png", scene);
const flameTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flame.png", scene);

let paddleDistance = 6.5;
paddle1.position.x = paddleDistance;
paddle2.position.x = -paddleDistance;

let score1 = 0, score2 = 0;
let vx = 0.07, vz = 0.04;
let paused = true;
let awaitingStart = true;
let acceptingInput = true;
let boostLevel = 0;
const boostPressed = new Set();
const keysPressed = new Set();

const pauseOverlay = document.getElementById("pauseOverlay");
const startPrompt  = document.getElementById("startPrompt");

function updatePauseOverlay() {
  pauseOverlay.style.visibility = paused && !awaitingStart ? "visible" : "hidden";
}

function updateStartPrompt() {
  startPrompt.style.visibility = awaitingStart ? "visible" : "hidden";
}

function updateScore() {
  document.getElementById("scoreBoard").textContent = `Player 1: ${score1} | Player 2: ${score2}`;
}

window.addEventListener("keydown", e => {
  if (!acceptingInput) return;
  keysPressed.add(e.key);

  if (e.key === "a")
    boostPressed.add("paddle1");
  if (e.key === "ArrowRight")
    boostPressed.add("paddle2");

  if (e.code === "Space") {
    if (awaitingStart) {
      awaitingStart = false;
      paused = false;
      updateStartPrompt();
      updatePauseOverlay();
    } else {
      paused = !paused;
      updatePauseOverlay();
    }
  }
});

window.addEventListener("keyup", e => {
  keysPressed.delete(e.key);
  if (e.key === "a")
    boostPressed.delete("paddle1");
  if (e.key === "ArrowRight")
    boostPressed.delete("paddle2");
});

function resetPaddles() {
  paddle1.position.z = 0;
  paddle2.position.z = 0;
}

function resetBall() {
  awaitingStart = true;
  ball.isVisible = true;
  vx = (Math.random() < 0.5 ? -1 : 1) * 0.07;
  vz = (Math.random() < 0.5 ? -1 : 1) * 0.04;
  resetPaddles();
  updateFireTrail();
  updatePauseOverlay();
  updateStartPrompt();
}


let fireTrail;
const baseRate = 50;
const baseSize = 0.01;

function createFireTrail(ball, scene, flameTexture) {
  const fire = new BABYLON.ParticleSystem("fireTrail", 200, scene);

  fire.particleTexture = flameTexture;
  fire.emitter = ball;

  fire.minEmitBox = new BABYLON.Vector3(0, 0, 0);
  fire.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

  fire.color1 = new BABYLON.Color4(1, 0.4, 0, 1);
  fire.color2 = new BABYLON.Color4(1, 0.1, 0, 0.8);
  fire.colorDead = new BABYLON.Color4(0, 0, 0, 0);

  fire.minSize = 0.01;
  fire.maxSize = 0.1;

  fire.minLifeTime = 0.1;
  fire.maxLifeTime = 0.25;

  fire.emitRate = 50;

  fire.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
  fire.gravity = BABYLON.Vector3.Zero();

  fire.direction1 = new BABYLON.Vector3(-1, 0.1, -0.1);
  fire.direction2 = new BABYLON.Vector3(-1, -0.1, 0.1);

  fire.minAngularSpeed = 0;
  fire.maxAngularSpeed = Math.PI;

  fire.minEmitPower = 0.5;
  fire.maxEmitPower = 1.0;
  fire.updateSpeed = 0.01;

  fire.start();

  return fire;
}

function updateFireTrail() {
  if (!fireTrail) {
    fireTrail = createFireTrail(ball, scene, flameTexture);
  }
  fireTrail.emitter = ball;
  fireTrail.emitRate = baseRate + 300 * boostLevel;
  fireTrail.minSize = baseSize + 0.05 * boostLevel;
  fireTrail.maxSize = baseSize + 0.1 * boostLevel;
  fireTrail.direction1 = new BABYLON.Vector3(-vx, 0.1, -vz).normalize();
  fireTrail.direction2 = new BABYLON.Vector3(-vx, -0.1, -vz).normalize();
}

// Main game loop
scene.onBeforeRenderObservable.add(() => {
  if (paused) return;

  const deltaFactor = engine.getDeltaTime() / (1000 / 60);
  const stepX = vx * deltaFactor;
  const stepZ = vz * deltaFactor;
  const stepLength = Math.hypot(stepX, stepZ);
  if (stepLength === 0) return;

  // Handle paddle movement
  const paddleSpeed = 0.125 * deltaFactor;
  if (keysPressed.has("ArrowUp")) paddle2.position.z -= paddleSpeed;
  if (keysPressed.has("ArrowDown")) paddle2.position.z += paddleSpeed;
  if (keysPressed.has("w")) paddle1.position.z -= paddleSpeed;
  if (keysPressed.has("s")) paddle1.position.z += paddleSpeed;

  paddle1.position.z = Math.min(Math.max(paddle1.position.z, lowerLimitZ), upperLimitZ);
  paddle2.position.z = Math.min(Math.max(paddle2.position.z, lowerLimitZ), upperLimitZ);

  const origin = ball.position.clone();
  const dir = new BABYLON.Vector3(stepX, 0, stepZ).scale(1 / stepLength);
  const radius = ball.getBoundingInfo().boundingSphere.radius;
  const ray = new BABYLON.Ray(origin, dir, stepLength + radius);
  const bounceables = [paddle1, paddle2, wallTop, wallBottom];
  const picks = scene.multiPickWithRay(ray, mesh => bounceables.includes(mesh));

  if (picks.length) {
    picks.sort((a, b) => a.distance - b.distance);
    const pick = picks[0];

    if (pick.hit && pick.distance <= stepLength + radius) {
      const travel = Math.max(pick.distance - radius, 0);
      ball.position = origin.add(dir.scale(travel));

      const N = pick.getNormal(true);
      const V = new BABYLON.Vector3(vx, 0, vz);
      const dot = BABYLON.Vector3.Dot(V, N);
      const R = V.subtract(N.scale(2 * dot));

      let boost = 1.0;
      if (pick.pickedMesh === paddle1 && boostPressed.has("paddle1")) {
        boost *= 1.25;
        boostLevel++;
        updateFireTrail();
        flashPaddle(paddle1, scene);
      } else if (pick.pickedMesh === paddle2 && boostPressed.has("paddle2")) {
        boost *= 1.25;
        boostLevel++;
        updateFireTrail();
        flashPaddle(paddle2, scene);
      }
      // Glow effect during boost
      ballMaterial.emissiveColor = new BABYLON.Color3(1, 0.4, 0);
      ballMaterial.emissiveIntensity = 0.05 * Math.pow(boostLevel, 2);

      vx = R.x * boost;
      vz = R.z * boost;

      spawnFlash(ball.position, scene, warmYellow, flareTexture);

      const leftover = stepLength - travel;
      const newDir = new BABYLON.Vector3(vx, 0, vz).normalize();
      ball.position = ball.position.add(newDir.scale(leftover));
    } else {
      ball.position = origin.add(dir.scale(stepLength));
    }
  } else {
    ball.position = origin.add(dir.scale(stepLength));
  }

  if (ball.position.x < -paddleDistance - 1.5 || ball.position.x > paddleDistance + 1.5) {
    paused = true;
    acceptingInput = false;
    if (ball.position.x > paddleDistance + 1.5)
      score2++;
    else score1++;
    updateScore();

    const lastVx = vx, lastVz = vz;
    ball.isVisible = false;
    
    boostLevel = 0;
    updateFireTrail();

    explodeBall(scene, ball, ballMaterial, lastVx, lastVz);
    setTimeout(() => {
      ballMaterial.emissiveIntensity = 0;
      ballMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
      gatherBall(scene, ballMaterial, () => {
        ball.position.set(0, 0, 0);
        ball.isVisible = true;
        resetBall();
        acceptingInput = true;
      });
    }, 500);
  }
});

engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());

updateScore();
resetBall();
