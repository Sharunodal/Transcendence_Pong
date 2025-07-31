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

  const wallTop = BABYLON.MeshBuilder.CreateBox("wallTop", {
    width: 100,
    height: 0.2,
    depth: 0.5,
  }, scene);
  wallTop.position.z = 4.8;
  wallTop.material = materials.wallMaterial;

  const wallBottom = wallTop.clone("wallBottom");
  wallBottom.position.z = -4.8;

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
    wallTop,
    wallBottom,
    floor,
    limits: { upperLimitZ, lowerLimitZ }
  };
}
