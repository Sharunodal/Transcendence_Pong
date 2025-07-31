// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   sceneSetup.js                                      :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: arissane <arissane@student.hive.fi>        +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/07/29 13:27:10 by arissane          #+#    #+#             //
//   Updated: 2025/07/29 13:27:26 by arissane         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export function createScene(canvas) {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

  const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 15, 0), scene);
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, false);
  camera.inputs.clear();

  const hemi = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
  hemi.diffuse = BABYLON.Color3.White();
  hemi.groundColor = BABYLON.Color3.FromHexString("#888888");
  hemi.intensity = 0.8;

  const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(0, -1, 0), scene);
  sun.position = new BABYLON.Vector3(0, 40, 0);
  sun.intensity = 0.2;

  scene.clearColor = BABYLON.Color3.Black();

  return { scene, engine, camera, sun };
}
