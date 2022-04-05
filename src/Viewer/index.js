import React, { Component } from 'react';
import * as BABYLON from '@babylonjs/core';
import BabylonScene from '../BabylonScene'; // import the component above linking to file we just created.
// import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders";


import * as GUI from '@babylonjs/gui'

import './index.css';

import Modal from '../components/Modal'


const ybotURL = 'https://raw.githubusercontent.com/TheNosiriN/Babylon-Assets/master/ybot.babylon';
// const m4URL = 'https://raw.githubusercontent.com/TheNosiriN/Babylon-Assets/master/m4a1.obj';
// const testing = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Embedded/';

var fontFamily = 'Abel';



var firstPerson = true;



//animations
var skeleton = null;

// var ak47 = null;

var idleAnim = null;
var walkAnim = null;
var runAnim = null;
var sprintAnim = null;
var jumpAnim = null;


//variables
var animationBlend = 0.005;
var mouseSensitivity = 0.003;
var cameraSpeed = 0.0035;
var walkSpeed = 0.005;
var runSpeed = 0.05;
var sprintSpeed = 0.008;
// var jumpSpeed = 0.0005;
var jumpHeight = 8;
var gravity = new BABYLON.Vector3(0, -0.200, 0);

//in-game changed variables
var speed = 0;
var vsp = 0;
var jumped = false;
var mouseX = 0, mouseY = 0;
var mouseMin = -35, mouseMax = 100;

// instances of box

var instanceBox = 5;

var firstPersonCameraData;

export default class Viewer extends Component {




    constructor(props) {

        super(...arguments);
        this.onSceneMount = (e) => {
            const { canvas, scene, engine } = e;

            BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
                if (document.getElementById("customLoadingScreenDiv")) {
                    // Do not add a loading screen if there is already one
                    document.getElementById("customLoadingScreenDiv").style.display = "initial";
                    return;
                }
                this._loadingDiv = document.createElement("div");
                this._loadingDiv.id = "customLoadingScreenDiv";
                this._loadingDiv.innerHTML = "scene is currently loading";
                var customLoadingScreenCss = document.createElement('style');
                customLoadingScreenCss.type = 'text/css';
                customLoadingScreenCss.innerHTML = `
                #customLoadingScreenDiv{
                    // background: url(../src//assets/loader.gif) center center no-repeat;
                        width: 100%;
                        height: 100%;
                        position: absolute;
                        top: 0;
                        left: 0;
                        background-color: #f1f2f3;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                }
                `;
                document.getElementsByTagName('head')[0].appendChild(customLoadingScreenCss);
                this._resizeLoadingUI();
                window.addEventListener("resize", this._resizeLoadingUI);
                document.body.appendChild(this._loadingDiv);
            };

            BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = function () {
                document.getElementById("customLoadingScreenDiv").style.display = "none";
                console.log("scene is now loaded");
            }
            // Add Asset Manager
            // var assetsManager = new BABYLON.AssetsManager(scene);


            // SETUP CAMERA

            // FREE CAMERA (NON MESH)
            var camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 0, 6), scene);
            // camera.rotation = new BABYLON.Vector3(BABYLON.Tools.ToRadians(180));
            // camera.inputs.clear();
            camera.minZ = 0;


            // var lighting = new SetupLighthing(scene);


            // HEMLIGHT SETTINGS
            var hemLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
            hemLight.intensity = 0.2;
            hemLight.specular = BABYLON.Color3.Black();
            hemLight.groundColor = scene.clearColor.scale(0.75);

            // DIRECTIONAL LIGHT SETTINGS
            var dirLight = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
            dirLight.position = new BABYLON.Vector3(0, 130, 130);

            // SHADOW GENERATION SETTINGS
            var shadowGenerator = new BABYLON.ShadowGenerator(3072, dirLight);
            shadowGenerator.usePercentageCloserFiltering = true;


            // Initialize GizmoManager
            var gizmoManager = new BABYLON.GizmoManager(scene);
            gizmoManager.boundingBoxGizmoEnabled = true;
            gizmoManager.rotationGizmoEnabled = true;
            gizmoManager.positionGizmoEnabled = true;
            gizmoManager.clearGizmoOnEmptyPointerEvent = true;


            gizmoManager.onAttachedToMeshObservable.add((mesh) => {

                // if (pickResult.pickedMesh.name === "BackgroundPlane" || pickResult.pickedMesh.name === "BackgroundSkybox") {
                if (mesh === null) {
                    gizmoManager.boundingBoxGizmoEnabled = false;
                    gizmoManager.rotationGizmoEnabled = false;
                    gizmoManager.positionGizmoEnabled = false;
                    gizmoManager.clearGizmoOnEmptyPointerEvent = false;
                } else {
                    gizmoManager.boundingBoxGizmoEnabled = true;
                    gizmoManager.rotationGizmoEnabled = true;
                    gizmoManager.positionGizmoEnabled = true;
                    gizmoManager.clearGizmoOnEmptyPointerEvent = true;
                }
            });



            // ENV BUILDER SETTINGS 
            var helper = scene.createDefaultEnvironment({
                enableGroundShadow: true,
                enableGroundMirror: true,
                groundMirrorFallOffDistance: 1,
                groundSize: 250,
                skyboxSize: 250,
            });

            helper.setMainColor(scene.clearColor);
            helper.groundMaterial.diffuseTexture = null;
            helper.groundMaterial.alpha = 1;
            helper.groundMaterial.fogEnabled = true;
            helper.isPickable = false;

            // ADD SHAWDOWS TO MESH
            var addShadows = function (mesh) {
                mesh.receiveShadows = true;
                shadowGenerator.addShadowCaster(mesh);
            }

            // ADD MIRROR TO MESH
            var addToMirror = function (mesh) {
                helper.groundMirrorRenderList.push(mesh);
            }


            // INITIAL INPUTS CONTROL
            const dsm = new BABYLON.DeviceSourceManager(engine);
            var deltaTime = 5;

            // CHARACTER COMPONENTS
            var main = new BABYLON.Mesh("parent", scene);
            var target = new BABYLON.TransformNode();
            var character = new BABYLON.Mesh("character", scene);



            // CAMERA SETUP
            var firstPersonCamera = {
                middle: {
                    position: new BABYLON.Vector3(0, 1.75, -1),
                    fov: 1.25,
                    mouseMin: -90,
                    mouseMax: 90
                }
            };


            var thirdPersonCamera = {
                // middle: {
                //     position: new BABYLON.Vector3(0, 1.35, -5),
                //     fov: 0.8,
                //     mouseMin: -5,
                //     mouseMax: 45
                // },
                leftRun: {
                    position: new BABYLON.Vector3(0, 1.75, -1),
                    fov: 0,
                    mouseMin: 0,
                    mouseMax: 0,
                    type: "third"
                },
                // rightRun: {
                //     position: new BABYLON.Vector3(-0.7, 1.35, -4),
                //     fov: 0.8,
                //     mouseMin: -35,
                //     mouseMax: 45
                // },
                // far: {
                //     position: new BABYLON.Vector3(0, 1.5, -6),
                //     fov: 1.5,
                //     mouseMin: -5,
                //     mouseMax: 45
                // }
            };

            // SWITCH FIRST TO THIRD PERSON VIEW [NEED IMPLEMENTS IF WANT TO CHANGE TO THIRD]
            function switchCamera(type) {

                if (type.type === "third") {
                    console.log("MIGHT BE WORKING")
                    firstPersonCameraData = camera

                    camera = new BABYLON.ArcRotateCamera("thirdPersonCamera", 10, scene);
                    camera.parent = target;
                    camera.position = new BABYLON.Vector3(0, 1.75, -1)
                    camera.attachControl(canvas, true);
                } else {
                    // camera = firstPersonCameraData;
                    camera.position = type.position.divide(camera.parent.scaling);
                    camera.rotation.y = BABYLON.Tools.ToRadians(180);
                    camera.fov = type.fov;
                    mouseMin = type.mouseMin;
                    mouseMax = type.mouseMax;
                }
            }



            // Lighting for character 

            var smallLight = new BABYLON.PointLight("boxLight", new BABYLON.Vector3.Zero(), scene);
            smallLight.diffuse = new BABYLON.Color3(0.3, 0.5, 0.8);
            // smallLight.specular = smallLight.specular;
            smallLight.intensity = 1;
            smallLight.range = 5;


            //CHARACTER
            engine.displayLoadingUI();
            BABYLON.SceneLoader.ImportMesh("", "", ybotURL, scene, function (newMeshes, particleSystems, skeletons) {
                skeleton = skeletons[0];
                var body = newMeshes[1];
                var joints = newMeshes[0];
                body.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
                joints.parent = body;
                body.parent = character;

                // BABYLON.SceneLoader.ImportMesh("", "", m4URL, scene, function (newMeshes) {
                //     var m4 = newMeshes[0];
                //     m4.scaling = new BABYLON.Vector3(3, 3, 3);
                //     m4.setPivotPoint(new BABYLON.Vector3(4.5, 0.5, -2), BABYLON.Space.Local);

                //     m4.detachFromBone();
                //     skeleton.prepare();
                //     m4.attachToBone(skeleton.bones[37], body);

                //     //m4.position = new BABYLON.Vector3(0.45, -0.05, -0.2).divide(body.scaling);
                //     m4.rotation = new BABYLON.Vector3(
                //         BABYLON.Tools.ToRadians(180),
                //         BABYLON.Tools.ToRadians(-90),
                //         BABYLON.Tools.ToRadians(90),
                //     );
                // });


                // SETUP MATERIAL/TEXTURE/ANIMATION FOR CHARACTER MODEL
                // body.material = new BABYLON.StandardMaterial("character", scene);
                // joints.material = new BABYLON.StandardMaterial("joints", scene);
                // body.material.diffuseColor = new BABYLON.Color3(0.81, 0.24, 0.24);
                // joints.material.emissiveColor = new BABYLON.Color3(0.19, 0.29, 0.44);


                addToMirror(character);
                addShadows(character);


                var idleRange = skeleton.getAnimationRange("None_Idle");
                var walkRange = skeleton.getAnimationRange("None_Walk");
                var runRange = skeleton.getAnimationRange("None_Run");
                var sprintRange = skeleton.getAnimationRange("None_Sprint");
                var jumpRange = skeleton.getAnimationRange("None_Jump");

                idleAnim = scene.beginWeightedAnimation(skeleton, idleRange.from + 1, idleRange.to, 1.0, true);
                walkAnim = scene.beginWeightedAnimation(skeleton, walkRange.from + 1, walkRange.to, 0, true);
                runAnim = scene.beginWeightedAnimation(skeleton, runRange.from + 1, runRange.to, 0, true);
                sprintAnim = scene.beginWeightedAnimation(skeleton, sprintRange.from + 1, sprintRange.to, 0, true);
                jumpAnim = scene.beginWeightedAnimation(skeleton, jumpRange.from + 10, jumpRange.to, 0, true);

                // COLLISION DETECTION
                main.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);
                main.ellipsoidOffset = new BABYLON.Vector3(0, main.ellipsoid.y, 0);
                main.checkCollisions = true;
                //debug: drawEllipsoid(main);


                smallLight.parent = main;
                character.parent = main;
                target.parent = main;

                // SWITCH TO DETERMINE CAMERA POSITIONING
                if (firstPerson === true) {
                    camera.parent = character;
                    switchCamera(firstPersonCamera.middle);
                    main.position = new BABYLON.Vector3(0, 0, -8);
                }
                else {
                    camera.parent = target;
                    switchCamera(thirdPersonCamera.leftRun);
                    main.position = new BABYLON.Vector3(0, 3, -15);
                }




                engine.hideLoadingUI();
            }, function (evt) { });













            // const testingGLB = 'https://raw.githubusercontent.com/BabylonJS/Assets/master/meshes/';



            // BABYLON.SceneLoader.ImportMesh("", "", testingGLB, scene, function () {

            // }, function (evt) { });



            // SETUP KEYBINDS BEFORE SCENE LOADS
            scene.registerBeforeRender(function () {
                deltaTime = engine.getDeltaTime();

                updateCamera();

                if (character != null) {
                    var keyboard = dsm.getDeviceSource(BABYLON.DeviceType.Keyboard);
                    var mouse = dsm.getDeviceSource(BABYLON.DeviceType.Mouse);
                    if (keyboard) {
                        if (firstPerson === true) {
                            firstPersonMovement(
                                keyboard.getInput(87), //W
                                keyboard.getInput(83), //S
                                keyboard.getInput(65), //A
                                keyboard.getInput(68), //D
                                keyboard.getInput(32), //Space
                                // keyboard.getInput(16), //Shift
                                mouse.getInput(1) // Left Click to interact
                            );
                        } else {
                            thirdPersonMovement(
                                // keyboard.getInput(87), //W
                                // keyboard.getInput(83), //S
                                // keyboard.getInput(65), //A
                                // keyboard.getInput(68), //D
                                // keyboard.getInput(32), //Space
                                // keyboard.getInput(16), //Shift
                            );
                        }
                    }
                }



            });



            // KEYBOARD CONTROLS
            var mouseMove = function (e) {
                var movementX = e.movementX ||
                    e.mozMovementX ||
                    e.webkitMovementX ||
                    0;

                var movementY = e.movementY ||
                    e.mozMovementY ||
                    e.webkitMovementY ||
                    0;

                mouseX += movementX * mouseSensitivity * deltaTime;
                mouseY += movementY * mouseSensitivity * deltaTime;
                mouseY = clamp(mouseY, mouseMin, mouseMax);
            }


            // UPDATE CAMERA 
            function updateCamera() {
                target.rotation = lerp3(
                    target.rotation,
                    new BABYLON.Vector3(
                        BABYLON.Tools.ToRadians(mouseY),
                        BABYLON.Tools.ToRadians(mouseX), 0
                    ), cameraSpeed * deltaTime
                );
            }



            // THIRD PERSON MOVEMENT
            function thirdPersonMovement(up, down, left, right, jump, run) {
                var directionZ = up - down;
                var directionX = right - left;

                var vectorMove = new BABYLON.Vector3.Zero();
                var direction = Math.atan2(directionX, directionZ);

                var currentState = idleAnim;


                //MOVE
                if (directionX !== 0 || directionZ !== 0) {
                    if (run !== 1) {
                        currentState = runAnim;
                        speed = lerp(speed, runSpeed, runAnim.weight);
                    } else {
                        currentState = sprintAnim;
                        speed = lerp(speed, sprintSpeed, sprintAnim.weight);
                    }

                    var rotation = (target.rotation.y + direction) % 360;
                    character.rotation.y = lerp(
                        character.rotation.y, rotation, 0.25
                    );

                    vectorMove = new BABYLON.Vector3(
                        (Math.sin(rotation)), 0,
                        (Math.cos(rotation))
                    );
                } else {
                    speed = lerp(speed, 0, 0.001);
                }


                //JUMP
                if (jump === 1 && jumped === false) {
                    jumped = true;
                }
                if (jumped === true) {
                    if (vsp < jumpHeight) {
                        vsp += jumpHeight * 10;
                    } else {
                        vsp += gravity.y / 10;
                        vsp = Math.min(vsp, gravity.y);
                        if (vsp === gravity.y) {
                            vsp = gravity.y;
                            jumped = false;
                        }
                    }
                    // var rr = skeleton.getAnimationRange("None_Jump");
                    // var a = scene.beginAnimation(skeleton, rr.from + 1, rr.to, false, 1, function () {
                    //     jumped = false; console.log("stopped " + rr.from + 1 + " " + rr.to);
                    // });
                } else {
                    vsp = gravity.y;
                }


                var m = vectorMove.multiply(new BABYLON.Vector3().setAll(speed * deltaTime));
                main.moveWithCollisions(m.add(new BABYLON.Vector3(0, vsp, 0)));


                switchAnimation(currentState);
            }


            // FIRST PERSON MOVEMENT
            function firstPersonMovement(up, down, left, right, jump, run, leftclick) {
                var directionZ = up - down;
                var directionX = right - left;

                var vectorMove = new BABYLON.Vector3.Zero();
                var direction = Math.atan2(directionX, directionZ);

                var currentState = idleAnim;


                if (directionX !== 0 || directionZ !== 0) {
                    if (up === 1) {
                        if (run !== 1) {
                            currentState = walkAnim;
                            speed = -lerp(speed, walkSpeed, walkAnim.weight);
                        } else {
                            currentState = runAnim;
                            speed = -lerp(speed, runSpeed, runAnim.weight);
                        }
                    } else {
                        // currentState = "walk";
                        // speed = lerp(speed, walkSpeed, walkAnim.weight);
                    }

                    vectorMove = new BABYLON.Vector3(
                        (Math.sin((target.rotation.y + direction) - BABYLON.Tools.ToRadians(180))), vsp,
                        (Math.cos((target.rotation.y + direction) - BABYLON.Tools.ToRadians(180)))
                    );
                }

                character.rotation.y = target.rotation.y - BABYLON.Tools.ToRadians(180);
                camera.rotation.x = target.rotation.x;


                if (jump > 0 && jumped === false) {
                    jumped = true;
                }
                if (jumped === true) {
                    if (vsp < jumpHeight) {
                        vsp += jumpHeight / 10;
                    } else {
                        vsp += gravity.y / 10;
                        vsp = Math.min(vsp, gravity.y);
                        if (vsp === gravity.y) {
                            vsp = gravity.y;
                            jumped = false;
                        }
                    }
                    // var rr = skeleton.getAnimationRange("None_Jump");
                    // var a = scene.beginAnimation(skeleton, rr.from + 1, rr.to, false, 1, function () {
                    //     jumped = false; console.log("stopped " + rr.from + 1 + " " + rr.to);
                    // });
                } else {
                    vsp = gravity.y;
                }


                var m = vectorMove.multiply(new BABYLON.Vector3().setAll(speed * deltaTime));
                main.moveWithCollisions(m.add(gravity));

                switchAnimation(currentState);
            }


            // MOVEMENT OF CHARACTER
            function switchAnimation(anim) {
                var anims = [idleAnim, runAnim, walkAnim, sprintAnim];

                if (idleAnim !== undefined) {
                    for (var i = 0; i < anims.length; i++) {
                        if (anims[i] === anim) {
                            anims[i].weight += animationBlend * deltaTime;
                        } else {
                            anims[i].weight -= animationBlend * deltaTime;
                        }

                        anims[i].weight = clamp(anims[i].weight, 0.0, 1.0);
                    }
                }
            }




            //TOOLS
            function clamp(value, min, max) {
                return (Math.max(Math.min(value, max), min));
            }

            function lerp(start, end, speed) {
                return (start + ((end - start) * speed));
            }

            function lerp3(p1, p2, t) {
                var x = lerp(p1.x, p2.x, t);
                var y = lerp(p1.y, p2.y, t);
                var z = lerp(p1.z, p2.z, t);

                return new BABYLON.Vector3(x, y, z);
            }




            //mouse lock
            // Configure all the pointer lock stuff
            function setupPointerLock() {
                // register the callback when a pointerlock event occurs
                document.addEventListener('pointerlockchange', changeCallback, false);
                document.addEventListener('mozpointerlockchange', changeCallback, false);
                document.addEventListener('webkitpointerlockchange', changeCallback, false);

                // when element is clicked, we're going to request a
                // pointerlock
                canvas.onclick = function () {
                    canvas.requestPointerLock =
                        canvas.requestPointerLock ||
                        canvas.mozRequestPointerLock ||
                        canvas.webkitRequestPointerLock
                        ;

                    // Ask the browser to lock the pointer)
                    canvas.requestPointerLock();
                };

            }


            // called when the pointer lock has changed. Here we check whether the
            // pointerlock was initiated on the element we want.
            function changeCallback(e) {
                if (document.pointerLockElement === canvas ||
                    document.mozPointerLockElement === canvas ||
                    document.webkitPointerLockElement === canvas
                ) {
                    // we've got a pointerlock for our element, add a mouselistener
                    document.addEventListener("mousemove", mouseMove, false);
                } else {
                    // pointer lock is no longer active, remove the callback
                    document.removeEventListener("mousemove", mouseMove, false);
                }
            };


            setupPointerLock();
            // scene.detachControl();

            helper.ground.checkCollisions = true;
            helper.skybox.checkCollisions = true;


            // var gl = new BABYLON.GlowLayer("gl", scene);
            var pipeline = new BABYLON.DefaultRenderingPipeline(
                "pipeline", true, scene, [camera]
            );
            pipeline.samples = 4;
            // var ssao = new BABYLON.SSAORenderingPipeline('ssaopipeline', scene, { ssaoRatio: 0.99, combineRatio: 1 }, [camera]);
            // var postProcess = new BABYLON.PostProcess("anamorphic effects", "anamorphicEffects", [], null, 1, camera);





            var startingPoint;
            var currentMesh;

            var getGroundPosition = function () {
                var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh === ground; });
                if (pickinfo.hit) {
                    return pickinfo.pickedPoint;
                }

                return null;
            }

            var pointerDown = function (mesh) {
                currentMesh = mesh;
                console.log(currentMesh)
                startingPoint = getGroundPosition();
                if (startingPoint) { // we need to disconnect camera from canvas
                    setTimeout(function () {
                        camera.detachControl(canvas);
                    }, 100);
                }
            }

            var pointerUp = function () {
                if (startingPoint) {
                    camera.attachControl(canvas, true);
                    startingPoint = null;
                    return;
                }
            }

            var pointerMove = function () {
                if (!startingPoint) {
                    return;
                }
                var current = getGroundPosition();
                if (!current) {
                    return;
                }

                var diff = current.subtract(startingPoint);
                currentMesh.position.addInPlace(diff);

                startingPoint = current;

            }






            scene.onPointerObservable.add((pointerInfo) => {
                switch (pointerInfo.type) {
                    case BABYLON.PointerEventTypes.POINTERDOWN:
                        if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh !== ground) {
                            pointerDown(pointerInfo.pickInfo.pickedMesh)
                        }
                        break;
                    case BABYLON.PointerEventTypes.POINTERUP:
                        pointerUp();
                        break;
                    case BABYLON.PointerEventTypes.POINTERMOVE:
                        pointerMove();
                        break;
                    default:
                        break;
                }
            });




            // Create boxes in spaces
            // CreateSpacesBoxes(scene)
            // var box = createSpacesBoxes(scene)

            // addToMirror(box);
            // addShadows(box);

            var box = BABYLON.MeshBuilder.CreateBox("box", { size: 15 }, scene);
            box.position = new BABYLON.Vector3(8, 10, -35);
            box.checkCollisions = true;
            box.setEnabled(false);

            addToMirror(box);
            addShadows(box);
            box.material = new BABYLON.StandardMaterial("lightBox", scene);

            // box.alwaysSelectAsActiveMesh = true;

            // Initialize GizmoManager
            // var utilLayer = new BABYLON.UtilityLayerRenderer(scene);
            // utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
            // var gizmo = new BABYLON.BoundingBoxGizmo(BABYLON.Color3.FromHexString("#0984e3"), utilLayer)
            // gizmo.attachedMesh = box;
            gizmoManager.attachableMeshes = [box];
            gizmoManager.attachToMesh(box);


            // let instanceCount = instanceBox;

            box.registerInstancedBuffer("color", 4);
            box.instancedBuffers.color = new BABYLON.Color4(1, 1, 1, Math.random());

            // let baseColors = [];
            // let alphas = [];

            // let boxInstances = [];

            // for (var index = 0; index < instanceCount - 1; index++) {
            //     let instance = box.createInstance("box" + index);
            //     instance.position.x = 250 - Math.random() * 500;
            //     instance.position.y = 200 - Math.random() * 200;
            //     instance.position.z = 250 - Math.random() * 500;
            //     // instance.alwaysSelectAsActiveMesh = true;


            //     alphas.push(Math.random());
            //     baseColors.push(new BABYLON.Color4(Math.random(), Math.random(), Math.random(), Math.random()));
            //     instance.instancedBuffers.color = baseColors[baseColors.length - 1].clone();
            //     instance.checkCollisions = true;



            //     boxInstances.push(instance);
            // gizmoManager.attachableMeshes = instance
            // gizmoManager.attachToMesh(box);

            // instance.setEnabled(false);

            // var startPosition = new BABYLON.Vector3(instance.position.x, instance.position.y, instance.position.z);
            // var endPosition = new BABYLON.Vector3(instance.position.x + Math.random(), instance.position.y + Math.random(), instance.position.z + Math.random());
            // BABYLON.Animation.CreateAndStartAnimation("anim", box, "position", 30, 100, startPosition, endPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

            // }

            // gizmoManager.attachableMeshes = boxInstances;

            // gizmoManager.attachToMesh(boxInstances);
            // gizmoManager.attachableMeshes = boxInstances;

            // Create simple meshes
            // var spheres = []
            // for (var i = 0; i < 5; i++) {
            //     var sphereTest = BABYLON.Mesh.CreateIcoSphere("sphere", { radius: 0.2, flat: true, subdivisions: 1 }, scene);
            //     sphereTest.scaling.x = 2
            //     sphereTest.position.y = 1;
            //     sphereTest.material = new BABYLON.StandardMaterial("sphere material", scene)
            //     sphereTest.position.z = i + 5
            //     spheres.push(sphereTest)
            // }

            // Restrict gizmos to only spheres
            // gizmoManager.attachableMeshes = spheres

            // // Toggle gizmos with keyboard buttons
            // document.onkeydown = (e) => {
            //     if (e.key === 'y') {
            //         console.log("WORKING")
            //         gizmoManager.positionGizmoEnabled = !gizmoManager.positionGizmoEnabled
            //     }
            //     if (e.key === 'u') {
            //         gizmoManager.rotationGizmoEnabled = !gizmoManager.rotationGizmoEnabled
            //     }
            //     if (e.key === 'h') {
            //         gizmoManager.scaleGizmoEnabled = !gizmoManager.scaleGizmoEnabled
            //     }
            //     if (e.key === 'j') {
            //         gizmoManager.boundingBoxGizmoEnabled = !gizmoManager.boundingBoxGizmoEnabled
            //     }
            // }


            // Append glTF model to scene.
            // BABYLON.SceneLoader.Append("scenes/BoomBox/", "BoomBox.gltf", scene, function (scene) {

            // });



            // const sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
            // // Move the sphere upward 1/2 its height
            // sphere.position.y = 1;
            // sphere.checkCollisions = true;

            // var boundingBox = BABYLON.BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(sphere)

            // var utilLayer = new BABYLON.UtilityLayerRenderer(scene)
            // utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
            // var gizmo = new BABYLON.BoundingBoxGizmo(BABYLON.Color3.FromHexString("#0984e3"), utilLayer)
            // gizmo.attachedMesh = boundingBox;

            // var sixDofDragBehavior = new BABYLON.PointerDragBehavior()
            // boundingBox.addBehavior(sixDofDragBehavior)
            // var multiPointerScaleBehavior = new BABYLON.MultiPointerScaleBehavior()
            // boundingBox.addBehavior(multiPointerScaleBehavior)



            // Create the 3D UI manager
            // var manager = new BABYLON.GUI.GUI3DManager(scene);

            // // Create a horizontal stack panel
            // var panel = new BABYLON.GUI.StackPanel3D();

            // manager.addControl(panel);

            // // Let's add some buttons!
            // var addButton = function () {
            //     // background
            //     let disc = BABYLON.MeshBuilder.CreateDisc("button_disc", { radius: 0.8 }, scene);
            //     let mat = new BABYLON.StandardMaterial("button_mat", scene);
            //     mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
            //     disc.material = mat;
            //     disc.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            //     let pos = box.getAbsolutePivotPoint();
            //     disc.position = pos;
            //     disc.position.y += 3;

            //     // icon
            //     let iconplane = BABYLON.MeshBuilder.CreatePlane("iconplane", { size: 0.8 }, scene);
            //     let mat0 = new BABYLON.StandardMaterial("icon_mat", scene);
            //     mat0.opacityTexture = new BABYLON.Texture("https://i.imgur.com/rZKK60K.png", scene);
            //     mat0.diffuseColor = new BABYLON.Color3(1, 1, 1);
            //     iconplane.position = disc.position.clone();
            //     iconplane.position.z -= .1;
            //     iconplane.material = mat0;

            //     // https://doc.babylonjs.com/divingDeeper/mesh/mergeMeshes
            //     let finalMesh = BABYLON.Mesh.MergeMeshes(
            //         [disc, iconplane], // meshes list
            //         true, // dispose original meshes
            //         null, // don't care here
            //         null, // don't care here
            //         null, // don't care here
            //         true // yep we want multimaterials
            //     );

            //     let button = new BABYLON.GUI.MeshButton3D(finalMesh);
            //     panel.addControl(button);

            //     button.pointerEnterAnimation = () => {
            //         button.mesh.scaling.x = 0.9;
            //         button.mesh.scaling.y = 0.9;
            //         document.body.style.cursor = 'pointer';
            //     }

            //     button.pointerOutAnimation = () => {
            //         button.mesh.scaling.x = 0.8;
            //         button.mesh.scaling.y = 0.8;
            //         document.body.style.cursor = '';
            //     }
            // }

            // addButton();






            //Load GUI before scene loads
            // loadGUI();

            // async function loadGUI() {
            //     var guiAdvancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, scene);
            //     let loadedGUI = await advancedTexture.parseFromURLAsync("https://raw.githubusercontent.com/CharlesBreton99/sandbox-main/master/src/assets/guiTexture.json")
            // }




            // var plane = BABYLON.Mesh.CreatePlane("plane", 2);
            // plane.position.y = 2;
            // plane.position.x = 10;


            // // var advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane)
            // var advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane);


            // var button1 = GUI.Button.CreateSimpleButton("but1", "Click Me");
            // button1.width = 1;
            // button1.height = 0.4;
            // button1.color = "white";
            // button1.fontSize = 50;
            // button1.background = "green";
            // button1.onPointerUpObservable.add(function () {
            //     alert("you did it!");
            // });
            // advancedTexture.addControl(button1);



            // var plane1 = BABYLON.Mesh.CreatePlane("plane", 2);
            // plane1.parent = boxTitle;
            // plane1.position = new BABYLON.Vector3(0, 3, -1);

            // var advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane1);


            // var titleHeaders = ["NFTS", "PROJECTS", "ABOUT"];

            // let button = GUI.Button.CreateSimpleButton("but1", "ABOUT");
            // button.width = 1;
            // button.height = 0.4;
            // button.color = "white";
            // button.fontSize = 50;
            // button.background = "green";
            // button.onPointerUpObservable.add(function () {
            //     alert("you did it!");
            // });
            // advancedTexture.addControl(button);



            // for (let i = 0; i < titleHeaders.length; i++) {
            //     let button = GUI.Button.CreateSimpleButton("but" + i, titleHeaders[i]);
            //     button.width = 1;
            //     button.height = 0.4;
            //     button.color = "white";
            //     button.fontSize = 50;
            //     button.background = "green";
            //     button.position = new BABYLON.Vector3(10, 0, 0)
            //     button.onPointerUpObservable.add(function () {
            //         alert("you did it!");
            //     });
            //     advancedTexture.addControl(button);
            // }
            // var button1 = GUI.Button.CreateSimpleButton("but1", "Click Me");
            // button1.width = 1;
            // button1.height = 0.4;
            // button1.color = "white";
            // button1.fontSize = 50;
            // button1.background = "green";
            // button1.onPointerUpObservable.add(function () {
            //     alert("you did it!");
            // });
            // advancedTexture.addControl(button1);


            // const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane, 2*512, 3*512);


            // const panel = new BABYLON.GUI.StackPanel();
            // panel.verticalAlignment = 0;
            // advancedTexture.addControl(panel);

            var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            var textblockLogo = new GUI.TextBlock("textLogo");
            textblockLogo.text = "charles \n breton.";
            textblockLogo.fontSize = '200px';
            textblockLogo.fontFamily = fontFamily
            textblockLogo.top = '-45%';
            textblockLogo.left = '-47%';
            textblockLogo.color = "white";
            advancedTexture.addControl(textblockLogo);


            var buttonblockMode = new GUI.Checkbox("checkerMode");
            buttonblockMode.width = "20px";
            buttonblockMode.height = "20px";
            buttonblockMode.text = "text";
            textblockLogo.fontSize = 24;
            buttonblockMode.top = '-45%';
            buttonblockMode.left = '47%';
            buttonblockMode.color = "white";
            // buttonblockMode.isChecked = true;
            advancedTexture.addControl(buttonblockMode);


            advancedTexture.registerClipboardEvents();

            advancedTexture.onClipboardObservable.add((ev) => {
                // Copy listener
                if (ev.type === BABYLON.ClipboardEventTypes.CUT) {
                    buttonblockMode.isChecked = !buttonblockMode.isChecked
                    firstPerson = !firstPerson;

                    if (firstPerson === true) {
                        camera.parent = character;
                        switchCamera(firstPersonCamera.middle);
                    }
                    else {
                        camera.parent = target;
                        switchCamera(thirdPersonCamera.leftRun);
                    }


                }
            });






            // var modal = document.getElementsByClassName("modal");
            // var trigger = document.querySelector(".trigger");
            // var closeButton = document.querySelector(".close-button");


            var project01 = ["Longevity Training", "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FmFNrpgu0Hvyq0AfeSGf1Zh%2FLONGEVITY-DESIGN%3Fnode-id%3D0%253A1"];

            function toggleModal(data) {
                localStorage.setItem("modalData", JSON.stringify(data));
                props.onClose()
                console.log("this is working")
                document.exitPointerLock();
                return <Modal title="My Modal" />
            }





            const createItemCard = (imageUrl, title, position, linkUrl) => {
                const card = BABYLON.MeshBuilder.CreateBox("detail-card", { height: 3, width: 1.6, depth: 0.2 });
                card.position = new BABYLON.Vector3(6, 1.5, position);
                card.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

                const plane = BABYLON.MeshBuilder.CreatePlane("plane", { height: 3, width: 1.6 });
                plane.position.z = -0.11;
                plane.position.y = -0.0;
                plane.parent = card;

                const advancedTexture03 = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 2 * 512, 3 * 512);

                const panel = new GUI.StackPanel();
                panel.verticalAlignment = 0;
                advancedTexture03.addControl(panel);

                const image = new GUI.Image("image", imageUrl);
                image.height = "1600px";
                image.width = "1200px";
                // image.paddingTop = 140;
                // image.paddingLeft = 40;
                // image.paddingRight = 40;
                // image.
                panel.addControl(image);


                const button1 = GUI.Button.CreateSimpleButton("but1", title);
                button1.width = 0.5;
                button1.height = 0.1;
                button1.color = "white";
                button1.background = "#000";
                button1.fontSize = 50;
                button1.fontFamily = fontFamily;
                button1.paddingBottom = 20;
                button1.top = 10
                button1.left = 250
                button1.paddingLeft = 300;

                // button1.paddingRight = 40;

                button1.onPointerUpObservable.add(function () {
                    console.log("button1 clicked");

                    let displayNft = [title, linkUrl];
                    console.log(displayNft)
                    toggleModal(displayNft);
                });
                button1.verticalAlignment = 0;
                advancedTexture03.addControl(button1);
                // advancedTexture03.isEnabled(false);
                // card.isVisible(false);
                card.position.y = -10;
                return card;
            };

            var matrixNftList = [];
            var nftData01 = [];
            nftData01.title = "MATRIX #2028";
            nftData01.url = "https://niftys.com/_next/image?url=https%3A%2F%2Fd2yuebc8sj17lc.cloudfront.net%2Ffilters%3Aautojpg()%2Fv2-production-nfts%2F0x423e540cb46db0e4df1ac96bcbddf78a804647d8-2028&w=3840&q=75";
            nftData01.linkUrl = "https://niftys.com/nft/0x423e540cb46db0e4df1ac96bcbddf78a804647d8/2028";



            var nftData02 = [];
            nftData02.title = "MATRIX #54144";
            nftData02.url = "https://niftys.com/_next/image?url=https%3A%2F%2Fd2yuebc8sj17lc.cloudfront.net%2Ffilters%3Aautojpg()%2Fv2-production-nfts%2F0x28e4b03bc88b59d25f3467b2252b66d4b2c43286-54144&w=3840&q=75"
            nftData02.linkUrl = "https://niftys.com/nft/0x28e4b03bc88b59d25f3467b2252b66d4b2c43286/54144";



            matrixNftList[0] = nftData01;
            matrixNftList[1] = nftData02;


            var initialPositionY = -10

            const createMatrixItemCard = () => {
                var nftList = [];
                for (let i = 0; i < matrixNftList.length; i++) {
                    // createItemCard(matrixNftList[i].url, matrixNftList[i].title, (i * -2) + initialPositionY, matrixNftList[i].linkUrl);
                    let nftCardData = createItemCard(matrixNftList[i].url, matrixNftList[i].title, (i * -2) + initialPositionY, matrixNftList[i].linkUrl);
                    // nftCardData.position.y = 0;
                    // console.log(typeof nftCardData);
                    nftList.push(nftCardData);
                }
                return nftList
            }
            var nftCards = []
            nftCards = createMatrixItemCard();
            createMatrixItemCard();






            // Add Objects holder which will redirect to a iframe


            var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {
                diameter: 2,
                segments: 32
            }, scene);
            sphere.position = new BABYLON.Vector3(-4, -10, -12);
            // sphere.isEnabled

            var meshContent = {
                box: 'This is extremely nice BOX!  < br / > < p style = "color:green" > No problems with CSS styling. < /p>',
                sphere: 'This SPHERE is really wonderful!  < br / > < h3 > HTML tags allowed: ) < /h3>'
            }

            scene.onPointerUp = function (evt, pickResult) {
                if (pickResult.hit) {
                    console.log("pickResult.hit: " + pickResult.pickedMesh.name);
                    if (pickResult.pickedMesh.name === "sphere") {
                        console.log("In the list"); // YES! Our mesh is in the list (ground is not there)
                        toggleModal(project01); // If there was no modal before, it will be shown; it there was modal already, it will be invisible
                        console.log("Mesh: " + pickResult.pickedMesh.name + "; Content: " + meshContent[pickResult.pickedMesh.name]);
                        // document.getElementById("iframe_custom").innerHTML = meshContent[pickResult.pickedMesh.name];
                        // You can also use iframe here to display any content. All you need is to bind iframe src value with mesh in our meshContent list
                        // and then change the code above to load the iframe src into the modal
                    }
                }
            }





            // var URL = "https://raw.githubusercontent.com/CharlesBreton99/me-project/master/src/assets/matrix.babylon"

            // var matrixMeshSkeleton = null;

            // BABYLON.SceneLoader.ImportMesh("", "", URL, scene, function (newMeshes) {
            //     var mesh = newMeshes[1];
            //     mesh.position = new BABYLON.Vector3(6, -10, -8)
            //     mesh.scaling = new BABYLON.Vector3(0.0023, 0.0023, 0.0023);
            //     mesh.rotation = new BABYLON.Vector3(Math.PI / 2, 0, Math.PI / 2);

            //     // gizmoManager.attachableMeshes = mesh;
            //     // gizmoManager.attachToMesh(mesh);
            //     // engine.hideLoadingUI();
            //     mesh.checkCollisions = true;

            //     matrixMeshSkeleton = mesh;

            //     console.log(mesh)
            //     console.log(matrixMeshSkeleton)
            // }, function (evt) { });


            // matrixMeshSkeleton.isEnabled(false);







            // var assetsManager = new BABYLON.AssetsManager(scene);


            // assetsManager.onTaskSuccessObservable.add(function (task) {
            //     if (task.name === "task") {
            //         // task.loadedMeshes[0].parent = scene.getMeshByName("ground");
            //         // task.loadedMeshes[0].setPositionWithLocalVector(new BABYLON.Vector3(0, 8, 0)) // x == z , y == z, z == y from player's view
            //         // task.loadedMeshes[0].rotation = new BABYLON.Vector3(-Math.PI / 2, 0, 0);

            //         // //Simple invisble crate that acts as a hitbox to avoid expensive pixel-perfect collision
            //         // var box = BABYLON.MeshBuilder.CreateBox("myBox", { height: 1.5, width: 0.50, depth: 1 }, game.scene);
            //         // box.isVisible = false;
            //         // box.setPositionWithLocalVector(new BABYLON.Vector3(0, 1, 0))
            //         // box.showBoundingBox = true;
            //         // box.parent = task.loadedMeshes[0];
            //         // box.checkCollisions = true;
            //     }
            //     else if (task.name === "task2") {
            //         task.loadedMeshes[0].parent = scene.getMeshByName("ground");
            //         task.loadedMeshes[0].setPositionWithLocalVector(new BABYLON.Vector3(-6, 8, -4)) // x == z , y == z, z == y from player's view
            //         task.loadedMeshes[0].rotation = new BABYLON.Vector3(-Math.PI / 2, 0, 0);
            //         task.loadedMeshes[0].scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            //     }
            //     console.log('task successful', task);
            // });




            // // Called when all tasks in the assetsManger are done
            // assetsManager.onTasksDoneObservable.add(function (tasks) {
            //     // var errors = tasks.filter(function (task) { return task.taskState === BABYLON.AssetTaskState.ERROR });
            //     // var successes = tasks.filter(function (task) { return task.taskState !== BABYLON.AssetTaskState.ERROR });

            //     //console.log(tasks);
            // });


            // // assetsManager.addMeshTask("task", "", "./scenes/", "dummy3.babylon");
            // assetsManager.addMeshTask("task2", "", "../assets/", "skull.babylon");


            // assetsManager.load();













            var boxTitle = BABYLON.MeshBuilder.CreateBox("box", { height: 500, width: 500, depth: 0.25 });
            boxTitle.checkCollisions = true;
            boxTitle.position.z = -3.8

            // Create the 3D UI manager
            var manager = new GUI.GUI3DManager(scene);

            // Create a horizontal stack panel
            var panel = new GUI.StackPanel3D();

            panel.margin = 0.05;
            // panel.scaling = 10;
            // panel.width = 0.25;
            // panel.rotation = 0.2;


            manager.addControl(panel);
            panel.position = new BABYLON.Vector3(0, 2, -4);
            // panel.position = new BABYLON.Vector3(BABYLON.Tools.ToRadians(180));


            var titleHeaders = ["sandbox", "projects", "about"];


            var clearMeshes = () => {
                box.setEnabled(false);
                for (let i = 0; i < nftCards.length; i++) {
                    nftCards[i].position.y = -10;
                }
                sphere.position.y = -10
            }




            // Let's add some buttons!
            var addButton = function () {
                panel.isVertical = true;

                for (let i = 0; i < titleHeaders.length; i++) {
                    let button = new GUI.Button3D("titles" + i);
                    button.imageUrl = "../assets/info.png";
                    // button.imageUrl("../assets/info.png")
                    // addToMirror(button);




                    button.onPointerUpObservable.add(function (info) {
                        console.log(info._y);
                        if (info._y < 1.5 && info._y !== 0) {
                            console.log("SANDBOX")

                            clearMeshes();
                            box.setEnabled(true);

                            for (let i = 0; i < nftCards.length; i++) {
                                nftCards[i].position.y = 2;
                            }



                        } else if (info._y > 2.5) {
                            console.log("ABOUT")
                            clearMeshes();

                        } else if (info._y > 1.5 && info._y < 2.5) {
                            console.log("PROJECTS")
                            clearMeshes();
                            sphere.position.y = 1


                        } else {
                            console.log("NO SELECTION")
                        }
                    });
                    let text1 = new GUI.TextBlock();
                    text1.text = titleHeaders[i];
                    text1.color = "#FFFFFF";
                    text1.fontSize = 48;
                    text1.fontFamily = fontFamily
                    button.content = text1;

                    panel.addControl(button);
                    // addToMirror(panel);
                }



            }

            addButton();
























            let reticule = addCrosshair(scene, camera)

            let startButton = StartButton();
            // let FPSCounter = FpsCounter();



            // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
            const ground = null;


            engine.runRenderLoop(() => {
                scene.debugLayer.show({
                    embedMode: true,
                });

                if (scene) {

                    scene.render();
                }
            });
        };
    }
    render() {
        return (
            React.createElement(BabylonScene, { onSceneMount: this.onSceneMount })
        );
    }
}

// function SetupLighthing(scene) {
//     var lighting = [];

//      // HEMLIGHT SETTINGS
//     var hemLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
//     hemLight.intensity = 0.2;
//     hemLight.specular = BABYLON.Color3.Black();
//     hemLight.groundColor = scene.clearColor.scale(0.75);

//     // DIRECTIONAL LIGHT SETTINGS
//     var dirLight = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
//     dirLight.position = new BABYLON.Vector3(0, 130, 130);

//     // SHADOW GENERATION SETTINGS
//     var shadowGenerator = new BABYLON.ShadowGenerator(3072, dirLight);
//     shadowGenerator.usePercentageCloserFiltering = true;

//     lighting.push(hemLight);
//     lighting.push(dirLight);
//     lighting.push(shadowGenerator);

//     return lighting;
// }

function StartButton() {

    var startDiv = document.getElementById("startDiv");

    if (startDiv) {
        startDiv.parentNode.removeChild(startDiv);
    }

    startDiv = document.createElement("div");
    startDiv.style.display = "flex";
    startDiv.style.width = "100%";
    startDiv.style.height = "100%";
    startDiv.style.backgroundColor = "grey";
    startDiv.style.alignItems = "center"
    startDiv.style.justifyContent = "center"
    // startDiv.style.textAlign = "center";
    // startDiv.style.verticalAlign = "middle";



    startDiv.id = "startDiv";
    startDiv.style.position = "absolute";
    startDiv.style.top = "0";
    startDiv.style.left = "0";


    startDiv.style.pointerEvents = "none"


    var startDivDot = document.createElement("span");

    startDivDot.className = "EnterGame";

    startDiv.appendChild(startDivDot);

    var startDivText = document.createElement("span");

    startDivText.textContent = "PRESS SPACEBAR";
    startDivText.fontFamily = fontFamily

    startDivText.style.left = "0";
    // startDivText.style.fontFamily = "monospace";
    startDivText.style.color = "white";
    startDivText.style.fontSize = "50px"


    // startDivText.style.position.x = "50%"


    startDiv.appendChild(startDivText);
    document.body.appendChild(startDiv);



    window.addEventListener("keydown", (input) => {
        startDiv.style.visibility = "hidden";
        startDiv.remove();
    });

    return startDiv;
}


function FpsCounter() {

    var fpsDiv = document.getElementById("fpsDiv");

    if (fpsDiv) {
        fpsDiv.parentNode.removeChild(fpsDiv);
    }

    fpsDiv = document.createElement("div");

    fpsDiv.style.width = "100%";
    fpsDiv.style.height = "100%";
    // startDiv.style.textAlign = "center";
    // startDiv.style.verticalAlign = "middle";



    fpsDiv.id = "fpsDiv";
    fpsDiv.style.position = "absolute";
    fpsDiv.style.top = "0";
    fpsDiv.style.left = "0";



    var fpsDivDot = document.createElement("span");

    fpsDivDot.className = "fpscounter";

    fpsDiv.appendChild(fpsDivDot);

    var fpsDivText = document.createElement("span");

    fpsDivText.textContent = "FPS: ";
    fpsDivText.style.fontFamily = "monospace";
    fpsDivText.style.color = "red";
    fpsDivText.style.fontSize = "20px"
    // startDivText.style.position.x = "50%"


    fpsDiv.appendChild(fpsDivText);
    document.body.appendChild(fpsDiv);



    window.addEventListener("keydown", (input) => {
        // startDiv.style.visibility = "hidden";
        // startDiv.remove();
    });

    return fpsDiv;
}

function addCrosshair(scene, camera) {

    let w = 128

    let texture = new BABYLON.DynamicTexture('reticule', w, scene, false)
    texture.hasAlpha = true

    let ctx = texture.getContext()
    let reticule

    const createOutline = () => {
        // ctx.moveTo(c, w * 0.25)
        // ctx.lineTo(c, c)
        // ctx.lineTo(w * 0.25, c)

        // ctx.moveTo(w * 0.75, c)
        // ctx.lineTo(w - c, c)
        // ctx.lineTo(w - c, w * 0.25)

        // ctx.moveTo(w - c, w * 0.75)
        // ctx.lineTo(w - c, w - c)
        // ctx.lineTo(w * 0.75, w - c)

        // ctx.moveTo(w * 0.25, w - c)
        // ctx.lineTo(c, w - c)
        // ctx.lineTo(c, w * 0.75)

        ctx.lineWidth = 1.5
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)'
        ctx.stroke()
    }

    const createNavigate = () => {
        ctx.fillStyle = 'solid'
        ctx.clearRect(0, 0, w, w)
        createOutline()

        ctx.strokeStyle = 'rgba(48, 48, 48, 5.9)'
        ctx.lineWidth = 10
        ctx.moveTo(w * 0.5, w * 0.25)
        ctx.lineTo(w * 0.5, w * 0.75)

        ctx.moveTo(w * 0.25, w * 0.5)
        ctx.lineTo(w * 0.75, w * 0.5)
        ctx.stroke()
        ctx.beginPath()

        texture.update()
    }

    createNavigate()

    let material = new BABYLON.StandardMaterial('reticule', scene)
    material.diffuseTexture = texture
    material.opacityTexture = texture
    material.emissiveColor.set(0, 1, 0)
    // material.color = new BABYLON.Color3(1, 1, 1);
    material.disableLighting = true

    let plane = BABYLON.MeshBuilder.CreatePlane('reticule', { size: 0.05 }, scene)
    plane.material = material
    plane.position.set(0, 0, 1.1)
    plane.isPickable = false
    plane.rotation.z = Math.PI / 4

    reticule = plane
    reticule.parent = camera

    // return null
    return reticule

}


// function createSpacesBoxes(scene) {

//     var box = BABYLON.MeshBuilder.CreateBox("box", { size: 30 }, scene);
//     box.position = new BABYLON.Vector3(8, -30, 18);
//     box.checkCollisions = true;


//     box.material = new BABYLON.StandardMaterial("lightBox", scene);

//     // box.alwaysSelectAsActiveMesh = true;

//     let instanceCount = instanceBox;

//     box.registerInstancedBuffer("color", 4);
//     box.instancedBuffers.color = new BABYLON.Color4(1, 1, 1, Math.random());

//     let baseColors = [];
//     let alphas = [];

//     let boxInstances = [];

//     for (var index = 0; index < instanceCount - 1; index++) {
//         let instance = box.createInstance("box" + index);
//         instance.position.x = 250 - Math.random() * 500;
//         instance.position.y = 200 - Math.random() * 200;
//         instance.position.z = 250 - Math.random() * 500;
//         // instance.alwaysSelectAsActiveMesh = true;


//         alphas.push(Math.random());
//         baseColors.push(new BABYLON.Color4(Math.random(), Math.random(), Math.random(), Math.random()));
//         instance.instancedBuffers.color = baseColors[baseColors.length - 1].clone();
//         instance.checkCollisions = true;



//         boxInstances.push(instance);

//         // instance.setEnabled(false);

//         // var startPosition = new BABYLON.Vector3(instance.position.x, instance.position.y, instance.position.z);
//         // var endPosition = new BABYLON.Vector3(instance.position.x + Math.random(), instance.position.y + Math.random(), instance.position.z + Math.random());
//         // BABYLON.Animation.CreateAndStartAnimation("anim", box, "position", 30, 100, startPosition, endPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

//     }
//     box.isEnabled = false;
// }