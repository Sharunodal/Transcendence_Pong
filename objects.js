// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   objects.js                                         :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: arissane <arissane@student.hive.fi>        +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/07/29 13:28:18 by arissane          #+#    #+#             //
//   Updated: 2025/07/29 13:28:22 by arissane         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export function createObjects(scene, materials) {
  const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.4 }, scene);
  ball.material = materials.ballMaterial;

  const paddle1 = BABYLON.MeshBuilder.CreateBox("paddle1", { width: 0.3, height: 0.3, depth: 2 }, scene);
  const paddle2 = BABYLON.MeshBuilder.CreateBox("paddle2", { width: 0.3, height: 0.3, depth: 2 }, scene);
  paddle1.material = paddle2.material = materials.paddleMaterial;
  let paddleDistance = 8;
  paddle1.position.x = paddleDistance;
  paddle2.position.x = -paddleDistance;

  const wallTop = BABYLON.MeshBuilder.CreateBox("wallTop", {
    width: 100,
    height: 0.2,
    depth: 0.5,
  }, scene);
  wallTop.material = materials.wallMaterial;

  const wallBottom = wallTop.clone("wallBottom");

  let wallDistance = 6.2;
  wallTop.position.z = wallDistance;
  wallBottom.position.z = -wallDistance;

  const floor = BABYLON.MeshBuilder.CreateGround("floor", {
    width: 102,
    height: 102,
  }, scene);
  floor.position.y = -0.15;
  floor.material = materials.floorMat;

  const paddleHalfZ = paddle1.getBoundingInfo().boundingBox.extendSize.z;
  const wallHalfZ = wallTop.getBoundingInfo().boundingBox.extendSize.z;
  const upperLimitZ = wallTop.position.z - wallHalfZ - paddleHalfZ;
  const lowerLimitZ = wallBottom.position.z + wallHalfZ + paddleHalfZ;

  return {
    ball,
    paddle1,
    paddle2,
    paddleDistance,
    wallTop,
    wallBottom,
    floor,
    limits: { upperLimitZ, lowerLimitZ }
  };
}
