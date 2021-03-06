import { Ball, Entity, Body } from "@warbird/core";
import { interpolateEntity } from "../helpers/interpolateEntity";
import { RenderObject } from "../../types";

export async function createBall(ball: Ball): Promise<RenderObject> {
  const { Mesh, MeshStandardMaterial, SphereGeometry } = await import("three");
  const body = Entity.getComponent(ball, Body);
  const geometry = new SphereGeometry(body.width / 2, 10, 10);
  const material = new MeshStandardMaterial({
    color: "#fff",
  });
  const mesh = new Mesh(geometry, material);

  mesh.position.x = body.x;
  mesh.position.y = body.y;
  material.metalness = 0.4;
  material.roughness = 0.7;
  material.wireframe = true;

  return {
    object: mesh,
    update: () => interpolateEntity(body, mesh),
  };
}
