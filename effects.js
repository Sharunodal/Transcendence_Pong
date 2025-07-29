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
