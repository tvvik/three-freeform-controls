import * as THREE from "three";
import Plane from "../../primitives/plane";
import {
  DEFAULT_COLOR_PLANE,
  DEFAULT_PLANE_HEIGHT,
  DEFAULT_PLANE_WIDTH
} from "../../utils/constants";
import Line from "../../primitives/line";
import { PickPlaneGroup } from "./index";

export default class PickPlane extends PickPlaneGroup {
  /**
   * @hidden
   */
  public readonly plane: Plane;
  /**
   * @hidden
   */
  public readonly boundary: Line;
  /**
   * @hidden
   */
  public readonly crossX: Line;
  /**
   * @hidden
   */
  public readonly crossY: Line;

  constructor(
    color = DEFAULT_COLOR_PLANE,
    width = DEFAULT_PLANE_WIDTH,
    height = DEFAULT_PLANE_HEIGHT
  ) {
    super();
    const boundaryGeometry = new THREE.BufferGeometry();
    const crossXGeometry = new THREE.BufferGeometry();
    const crossYGeometry = new THREE.BufferGeometry();

    const vertexMaxX = width / 2;
    const vertexMaxY = height / 2;

    boundaryGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute([
      vertexMaxX, vertexMaxY, 0,
      vertexMaxX, -vertexMaxY, 0,
      -vertexMaxX, -vertexMaxY, 0,
      -vertexMaxX, vertexMaxY, 0
    ], 3 ));

    crossXGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute([
      0, vertexMaxY, 0,
      0, -vertexMaxY, 0,
    ], 3 ));

    crossYGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute([
      -vertexMaxX, 0, 0,
      vertexMaxX, 0, 0,
    ], 3 ));

    this.boundary = new Line(color, boundaryGeometry);
    this.crossX = new Line("black", crossXGeometry);
    this.crossY = new Line("black", crossYGeometry);
    this.plane = new Plane(color, width, height);

    this.add(this.plane);
    this.add(this.boundary);
    this.add(this.crossX);
    this.add(this.crossY);
  }

  /**
   * @hidden
   */
  public getInteractiveObjects = () => {
    return [this.plane];
  };

  public setColor = (color: string) => {
    const planeMaterial = this.plane.material as THREE.MeshBasicMaterial;
    const boundaryMaterial = this.boundary.material as THREE.MeshBasicMaterial;
    planeMaterial.color.set(color);
    boundaryMaterial.color.set(color);
  };
}
