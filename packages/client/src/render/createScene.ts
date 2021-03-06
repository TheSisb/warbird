import { Entity, EntityType } from "@warbird/core";
import { objectFactoryByEntityType } from "./objects/objectFactoryByEntityType";
import { createSkyBox } from "./skybox";
import { Animation, RenderObject } from "../types";

export async function createScene(canvas: HTMLCanvasElement) {
  const {
    AmbientLight,
    DirectionalLight,
    PCFSoftShadowMap,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
  } = await import("three");
  const sky = await createSkyBox();
  const animations: Animation[] = [];
  const objects: RenderObject[] = [];
  const objectsByEntity = new Map<Entity, RenderObject>();
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  const ambientLight = new AmbientLight(0xffffff, 0.2);
  const directionalLight = new DirectionalLight(0xffffff, 0.5);
  const scene = new Scene();
  const camera = new PerspectiveCamera(30);
  const skyCamera = new PerspectiveCamera(30);

  renderer.setClearAlpha(0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  camera.position.set(0, 0, 75);
  skyCamera.position.set(0, 0, 75);

  directionalLight.position.set(-5, -15, 10);
  directionalLight.shadowMapWidth = 2048;
  directionalLight.shadowMapHeight = 2048;

  scene.add(ambientLight);
  scene.add(directionalLight);

  let previousTime = 0;
  let cameraTarget: Entity;

  function render(time: number) {
    const now = performance.now();

    if (!previousTime) {
      previousTime = time;
    }

    const deltaTime = time - previousTime;

    previousTime = time;

    for (let i = 0; i < objects.length; i++) {
      objects[i].update(deltaTime);
    }

    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];

      animation.update(deltaTime);

      if (now - animation.start >= animation.duration) {
        animations.splice(animations.indexOf(animation), 1);
        scene.remove(animation.object);
      }
    }

    if (cameraTarget) {
      const object = objectsByEntity.get(cameraTarget);

      if (object) {
        skyCamera.position.x = object.object.position.x * 0.05;
        skyCamera.position.y = object.object.position.y * 0.05;
        camera.position.x = object.object.position.x;
        camera.position.y = object.object.position.y;
      }
    }

    renderer.autoClear = true;
    renderer.render(scene, camera);
    renderer.autoClear = false;
    renderer.render(sky, skyCamera);
  }

  async function addObject(entity: Entity) {
    let object = objectsByEntity.get(entity);

    if (!object) {
      const createObject = objectFactoryByEntityType[entity.type as EntityType];

      if (createObject) {
        object = await createObject(entity);
      } else {
        throw new Error(`Entity ${(entity as Entity).type} not supported.`);
      }

      scene.add(object.object);
      objects.push(object);
      objectsByEntity.set(entity, object);
    }

    return object;
  }

  function removeObject(entity: Entity) {
    const object = objectsByEntity.get(entity);

    if (!object) {
      console.warn(
        `Attempted to remove render object for entity ${entity.id}, but no object was found.`,
      );
      return;
    }

    scene.remove(object.object);
    objects.splice(objects.indexOf(object), 1);
    objectsByEntity.delete(entity);
  }

  function addAnimation(animation: Animation) {
    animations.push(animation);
    scene.add(animation.object);
  }

  async function setCameraTarget(entity: Entity) {
    cameraTarget = entity;
  }

  function onWindowResize() {
    const { innerWidth, innerHeight } = window;

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    skyCamera.aspect = innerWidth / innerHeight;
    skyCamera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
  }

  window.addEventListener("resize", onWindowResize);

  onWindowResize();

  return {
    render,
    addObject,
    removeObject,
    addAnimation,
    camera,
    setCameraTarget,
  };
}
