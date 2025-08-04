// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   effects.js                                         :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: arissane <arissane@student.hive.fi>        +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/07/28 14:56:52 by arissane          #+#    #+#             //
//   Updated: 2025/07/28 14:56:54 by arissane         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

//create the shards that are used for explosion and reconstruction animations
export function makeShard(scene, ball, ballMaterial) {
  const s = BABYLON.MeshBuilder.CreateBox("shard", {
    width: 0.1 + Math.random() * 0.1,
    height: 0.05 + Math.random() * 0.05,
    depth: 0.05 + Math.random() * 0.1
  }, scene);

  s.position = ball.position.add(new BABYLON.Vector3(
    (Math.random() - 0.5) * 0.2,
    0,
    (Math.random() - 0.5) * 0.2
  ));

  s.rotation = new BABYLON.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  s.material = ballMaterial;
  return s;
}

//explode shards to the same direction the ball was going before reset
export function explodeBall(scene, ball, ballMaterial, lastVx, lastVz) {
  const pieces = [];
  for (let i = 0; i < 7; i++) {
    pieces.push(makeShard(scene, ball, ballMaterial));
  }

  //explosion strength
  new BABYLON.MeshExploder(pieces).explode(0.1);

  const baseDir = new BABYLON.Vector3(lastVx, 0, lastVz).normalize();
  pieces.forEach(p => {
    p.physicsImpostor = new BABYLON.PhysicsImpostor(
      p,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 0.1, restitution: 0.6, friction: 0.5 },
      scene
    );
    const rnd = () => (Math.random() - 0.5) * 0.6;
    const dir = baseDir.add(new BABYLON.Vector3(rnd(), rnd(), rnd())).normalize();
    //impulse
    p.physicsImpostor.applyImpulse(dir.scale(1), p.getAbsolutePosition());
    setTimeout(() => p.dispose(), 3000);
  });
}

//reconstruction animation when the ball reappears
export function gatherBall(scene, ballMaterial, onComplete) {
  const num = 32;
  const pieces = [];
  const radiusOuter = 2.5;

  for (let i = 0; i < num; i++) {
    const p = makeShard(scene, { position: BABYLON.Vector3.Zero() }, ballMaterial);
    // randomize angle
    const angle  = Math.random() * Math.PI * 2;
    // randomize spawn‐distance
    const radius = radiusOuter * (0.8 + 0.2 * Math.random());
    //  add vertical variation
    const height = (Math.random() - 0.5) * 0.5;

    p.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    // start invisible
    p.scaling = new BABYLON.Vector3(0, 0, 0);

    pieces.push(p);
  }

  pieces.forEach(p => {
    //Position animation
    const posAnim = new BABYLON.Animation(
      "gatherPos", "position", 40,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    posAnim.setKeys([
      { frame: 0,  value: p.position.clone() },
      { frame: 40, value: BABYLON.Vector3.Zero() }
    ]);

    //Scale animation
    const scaleAnim = new BABYLON.Animation(
      "gatherScale", "scaling", 40,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    scaleAnim.setKeys([
      { frame: 0,  value: new BABYLON.Vector3(0, 0, 0) },
      { frame: 40, value: new BABYLON.Vector3(1, 1, 1) }
    ]);

    //smooth easing
    const ease = new BABYLON.QuinticEase();
    ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    posAnim.setEasingFunction(ease);
    scaleAnim.setEasingFunction(ease);

    //notify Babylon about both animations and run simultaneously
    p.animations = [posAnim, scaleAnim];
    scene.beginAnimation(p, 0, 40, false, 0.7, () => {
      p.dispose();
      if (pieces.every(m => m.isDisposed())) {
        onComplete();
      }
    });
  });
}

//light flash effect when the ball hits an object
export function spawnFlash(position, scene, warmYellow, flareTexture) {
  const flash = new BABYLON.ParticleSystem("flash" + Math.random(), 30, scene);
  flash.particleTexture = flareTexture;
  flash.emitter = position.clone();
  flash.minEmitBox = flash.maxEmitBox = BABYLON.Vector3.Zero();
  flash.color1 = warmYellow;
  flash.color2 = BABYLON.Color3.White();
  flash.minSize = 0.15;
  flash.maxSize = 0.3;
  flash.minLifeTime = 0.15;
  flash.maxLifeTime = 0.25;
  flash.emitRate = 1000;
  flash.gravity = BABYLON.Vector3.Zero();
  flash.direction1 = new BABYLON.Vector3(-0.5, 0.3, 0.1);
  flash.direction2 = new BABYLON.Vector3(0.5, -0.3, -0.1);
  flash.manualEmitCount = 30;
  flash.disposeOnStop = true;
  flash.start();
  setTimeout(() => flash.stop(), 100);

  const light = new BABYLON.PointLight("flashLight" + Math.random(), position.clone(), scene);
  light.diffuse = new BABYLON.Color3(1, 0.9, 0.5);
  light.intensity = 2.0;
  light.range = 2;

  let fade = 1.0;
  const fadeInterval = setInterval(() => {
    fade -= 0.1;
    light.intensity = fade * 2;
    if (fade <= 0) {
      light.dispose();
      clearInterval(fadeInterval);
    }
  }, 30);

  const paddleSound = new BABYLON.Sound("paddleHit", "https://cdn.jsdelivr.net/gh/anrisan/assets/audio/ping.mp3", scene, null, {
    autoplay: true,
    volume: 0.7,
    spatialSound: true,
    maxDistance: 10,
    refDistance: 1,
  });
  paddleSound.setPosition(position);
}

export function flashPaddle(paddle, scene, color = new BABYLON.Color3(1, 0.5, 0)) {
  const material = paddle.material;
  const originalEmissive = material.emissiveColor.clone();

  const anim = new BABYLON.Animation(
    "paddleGlow",
    "emissiveColor",
    30,
    BABYLON.Animation.ANIMATIONTYPE_COLOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  anim.setKeys([
    { frame: 0, value: originalEmissive },
    { frame: 5, value: color },
    { frame: 15, value: originalEmissive }
  ]);

  material.animations = [anim];
  scene.beginAnimation(material, 0, 15, false);
}

let fireTrail     = null;

export function createFireTrail(ball, scene, flameTexture) {
  fireTrail = new BABYLON.GPUParticleSystem("fireTrail", { capacity:2000 }, scene);
  fireTrail.particleTexture  = flameTexture;
  fireTrail.emitter          = ball;
  fireTrail.particleEmitterType = new BABYLON.SphereParticleEmitter();
  fireTrail.particleEmitterType.radius      = 0.2;
  fireTrail.particleEmitterType.radiusRange = 1.0;

  fireTrail.color1       = new BABYLON.Color4(1,1,0,0.6);
  fireTrail.color2       = new BABYLON.Color4(1,1,0,0.4);
  fireTrail.colorDead    = new BABYLON.Color4(0,0,0,0);
  fireTrail.minLifeTime  = 0.15;
  fireTrail.maxLifeTime = 0.25;
  fireTrail.minEmitPower = 0.1; 
  fireTrail.maxEmitPower= 0.3;
  fireTrail.direction1   = new BABYLON.Vector3(0,1,0);
  fireTrail.direction2   = new BABYLON.Vector3(0,1,0);
  fireTrail.addSizeGradient(0,0.4).addSizeGradient(1,0.01);
  fireTrail.addColorGradient(0,   new BABYLON.Color4(1,1,0,0.6));
  fireTrail.addColorGradient(0.7, new BABYLON.Color4(1,1,0,0.4));
  fireTrail.addColorGradient(1.0, new BABYLON.Color4(0,0,0,0));
  fireTrail.addVelocityGradient(0,0).addVelocityGradient(1,-0.3);

  fireTrail.start();

  fireTrail.emitRate = 0;
  fireTrail.minSize  = 0;
  fireTrail.maxSize  = 0;
}

export function updateFireTrail(boostLevel) {
  if (!fireTrail) return;
  if (boostLevel <= 0) {
    fireTrail.emitRate = 0;
    fireTrail.minSize  = 0;
    fireTrail.maxSize  = 0;
  } else if (boostLevel > 5){
    fireTrail.emitRate = 50 * boostLevel - 5;
    fireTrail.minSize  = 0.05 * boostLevel - 5;
    fireTrail.maxSize  = 0.1 * boostLevel - 5;
  }
}

export function resetFireTrail(ball) {
  if (!fireTrail) return;
  fireTrail.reset();
  fireTrail.emitRate = 0;
  fireTrail.minSize  = 0;
  fireTrail.maxSize  = 0;
}