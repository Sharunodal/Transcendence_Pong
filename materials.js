// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   materials.js                                       :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: arissane <arissane@student.hive.fi>        +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/07/29 13:27:36 by arissane          #+#    #+#             //
//   Updated: 2025/07/29 13:28:11 by arissane         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export function createMaterials(scene) {
  const warmYellow = BABYLON.Color3.FromHexString("#FFCC00");

  const wallMaterial = new BABYLON.StandardMaterial("wallMat", scene);
  wallMaterial.diffuseColor = warmYellow;

  const paddleMaterial = new BABYLON.StandardMaterial("paddleMat", scene);
  paddleMaterial.diffuseColor = warmYellow;

  const ballMaterial = new BABYLON.StandardMaterial("ballMat", scene);
  ballMaterial.diffuseColor = BABYLON.Color3.White();

  const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
  floorMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  floorMat.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  [wallMaterial, paddleMaterial, ballMaterial, floorMat].forEach(mat => {
    mat.specularColor = BABYLON.Color3.Black();
    mat.specularPower = 1;
  });

  return { warmYellow, wallMaterial, paddleMaterial, ballMaterial, floorMat };
}
