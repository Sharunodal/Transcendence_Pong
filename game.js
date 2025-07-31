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

import { explodeBall, gatherBall, spawnFlash } from './effects.js';
import { createScene } from './sceneSetup.js';
import { createObjects } from './objects.js';
import { createMaterials } from './materials.js';

const canvas = document.getElementById("renderCanvas");
const { engine, scene, sun } = createScene(canvas);
const materials = createMaterials(scene);
const { ballMaterial, warmYellow } = materials;
const { ball, paddle1, paddle2, wallTop, wallBottom, floor, limits } = createObjects(scene, materials);
const { upperLimitZ, lowerLimitZ } = limits;

const particleTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png", scene);

let score1 = 0, score2 = 0;
let vx = 0.07, vz = 0.04;
let paused = true;
let paddleDistance = 8;
let awaitingStart = true;
let acceptingInput = true;
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
});

function resetBall() {
  ball.position.set(0, 0, 0);
  awaitingStart = true;
  ball.isVisible = true;
  vx = (Math.random() < 0.5 ? -1 : 1) * 0.07;
  vz = (Math.random() < 0.5 ? -1 : 1) * 0.04;
  updatePauseOverlay();
  updateStartPrompt();
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
  if (keysPressed.has("ArrowUp")) paddle1.position.z -= paddleSpeed;
  if (keysPressed.has("ArrowDown")) paddle1.position.z += paddleSpeed;
  if (keysPressed.has("w")) paddle2.position.z -= paddleSpeed;
  if (keysPressed.has("s")) paddle2.position.z += paddleSpeed;

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
      vx = R.x;
      vz = R.z;

      spawnFlash(ball.position, scene, warmYellow, particleTexture);

      const leftover = stepLength - travel;
      const newDir = new BABYLON.Vector3(vx, 0, vz).normalize();
      ball.position = ball.position.add(newDir.scale(leftover));
    } else {
      ball.position = origin.add(dir.scale(stepLength));
    }
  } else {
    ball.position = origin.add(dir.scale(stepLength));
  }

  if (ball.position.x < -paddleDistance || ball.position.x > paddleDistance) {
    paused = true;
    acceptingInput = false;
    if (ball.position.x < -paddleDistance) score2++;
    else score1++;
    updateScore();

    const lastVx = vx, lastVz = vz;
    ball.isVisible = false;

    explodeBall(scene, ball, ballMaterial, lastVx, lastVz);
    setTimeout(() => {
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
