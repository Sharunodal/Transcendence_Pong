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
  for (let i = 0; i < 8; i++) {
    pieces.push(makeShard(scene, ball, ballMaterial));
  }

  new BABYLON.MeshExploder(pieces).explode(0.3);

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
    p.physicsImpostor.applyImpulse(dir.scale(2), p.getAbsolutePosition());
    setTimeout(() => p.dispose(), 3000);
  });
}

export function gatherBall(scene, ballMaterial, onComplete) {
  const pieces   = [];
  const num      = 32;
  const rOuter   = 2.5;
  const rInner   = 1.8;

  for (let i = 0; i < num; i++) {
    const angle  = (i / num) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
    // random radius between inner and outer, bias toward outer
    const t       = Math.random() ** 0.8;
    const radius  = rInner + t * (rOuter - rInner);
    const p       = makeShard(scene, { position: BABYLON.Vector3.Zero() }, ballMaterial);

    p.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    pieces.push(p);
  }

  // Animate them inward
  pieces.forEach(p => {
    const anim = new BABYLON.Animation(
      "gatherAnim", "position", 60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    anim.setKeys([
      { frame: 0,  value: p.position.clone() },
      { frame: 40, value: BABYLON.Vector3.Zero() }
    ]);

    // smooth in‐and‐out easing
    const ease = new BABYLON.QuinticEase();
    ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    anim.setEasingFunction(ease);

    p.animations = [anim];
    scene.beginAnimation(p, 0, 40, false, 1, () => {
      p.dispose();
      if (pieces.every(m => m.isDisposed())) {
        onComplete();
      }
    });
  });
}
