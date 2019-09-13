import * as THREE from "three";
import Translation from "./translation";
import { DEFAULT_TRANSLATION_CONTROLS_SEPARATION } from "../utils/constants";
import Rotation from "./rotation";
import Pick from "./pick";
import PickPlane from "./pick-plane";
import { ISeparationT } from "../index";

export enum HANDLE_NAMES {
  XT = "xt_handle",
  YT = "yt_handle",
  ZT = "zt_handle",
  XR = "xr_handle",
  YR = "yr_handle",
  ZR = "zr_handle",
  PICK = "pick_handle",
  PICK_PLANE_XY = "pick_plane_xy_handle",
  PICK_PLANE_YZ = "pick_plane_yz_handle",
  PICK_PLANE_ZX = "pick_plane_zx_handle"
}

export type IHandle = Rotation | Translation | Pick | PickPlane;

export default class Controls extends THREE.Group {
  private readonly pick: Pick;
  private readonly pickPlaneXY: PickPlane;
  private readonly pickPlaneYZ: PickPlane;
  private readonly pickPlaneZX: PickPlane;
  private readonly translationXP: Translation;
  private readonly translationYP: Translation;
  private readonly translationZP: Translation;
  private readonly translationXN: Translation;
  private readonly translationYN: Translation;
  private readonly translationZN: Translation;
  private readonly rotationX: Rotation;
  private readonly rotationY: Rotation;
  private readonly rotationZ: Rotation;
  private handleTargetQuaternion = new THREE.Quaternion();
  private handleTargetEuler = new THREE.Euler();
  private objectWorldPosition = new THREE.Vector3();
  private objectTargetPosition = new THREE.Vector3();
  private objectTargetQuaternion = new THREE.Quaternion();
  private objectParentWorldPosition = new THREE.Vector3();
  private objectParentWorldQuaternion = new THREE.Quaternion();
  private objectParentWorldScale = new THREE.Vector3();
  private deltaQuaternion = new THREE.Quaternion();
  private touch1 = new THREE.Vector3();
  private touch2 = new THREE.Vector3();
  private minBox = new THREE.Vector3();
  private maxBox = new THREE.Vector3();
  private dragStartPoint = new THREE.Vector3();
  private dragIncrementalStartPoint = new THREE.Vector3();
  public isBeingDraggedTranslation = false;
  public isBeingDraggedRotation = false;

  constructor(public object: THREE.Object3D, private separationT?: ISeparationT) {
    super();

    this.computeObjectBounds();

    this.pick = new Pick();

    this.pickPlaneXY = new PickPlane("yellow");
    this.pickPlaneYZ = new PickPlane("cyan");
    this.pickPlaneZX = new PickPlane("pink");

    this.translationXP = new Translation("red");
    this.translationYP = new Translation("green");
    this.translationZP = new Translation("blue");

    this.translationXN = new Translation("red");
    this.translationYN = new Translation("green");
    this.translationZN = new Translation("blue");

    this.rotationX = new Rotation("red");
    this.rotationY = new Rotation("green");
    this.rotationZ = new Rotation("blue");

    this.setupTranslation();
    this.setupRotation();
    this.setupPickPlane();
    this.setupPick();
  }

  private setupPickPlane = () => {
    this.pickPlaneXY.name = HANDLE_NAMES.PICK_PLANE_XY;
    this.pickPlaneYZ.name = HANDLE_NAMES.PICK_PLANE_YZ;
    this.pickPlaneZX.name = HANDLE_NAMES.PICK_PLANE_ZX;

    this.pickPlaneYZ.up = new THREE.Vector3(1, 0, 0);
    this.pickPlaneZX.up = new THREE.Vector3(0, 1, 0);
    this.pickPlaneXY.up = new THREE.Vector3(0, 0, 1);

    this.pickPlaneYZ.rotateY(Math.PI / 2);
    this.pickPlaneZX.rotateX(Math.PI / 2);

    this.add(this.pickPlaneXY);
    this.add(this.pickPlaneYZ);
    this.add(this.pickPlaneZX);
  };

  private setupPick = () => {
    this.pick.name = HANDLE_NAMES.PICK;
    this.add(this.pick);
  };

  private setupTranslation = () => {
    this.translationXP.name = HANDLE_NAMES.XT;
    this.translationYP.name = HANDLE_NAMES.YT;
    this.translationZP.name = HANDLE_NAMES.ZT;

    this.translationXN.name = HANDLE_NAMES.XT;
    this.translationYN.name = HANDLE_NAMES.YT;
    this.translationZN.name = HANDLE_NAMES.ZT;

    this.translationXP.translateX(this.maxBox.x);
    this.translationYP.translateY(this.maxBox.y);
    this.translationZP.translateZ(this.maxBox.z);

    this.translationXN.translateX(this.minBox.x);
    this.translationYN.translateY(this.minBox.y);
    this.translationZN.translateZ(this.minBox.z);

    this.translationXP.rotateZ(-Math.PI / 2);
    this.translationZP.rotateX(Math.PI / 2);

    this.translationXN.rotateZ(Math.PI / 2);
    this.translationYN.rotateX(Math.PI);
    this.translationZN.rotateX(-Math.PI / 2);

    this.translationXP.up = new THREE.Vector3(0, 1, 0);
    this.translationYP.up = new THREE.Vector3(0, 0, 1);
    this.translationZP.up = new THREE.Vector3(0, 1, 0);

    this.translationXN.up = new THREE.Vector3(0, 1, 0);
    this.translationYN.up = new THREE.Vector3(0, 0, 1);
    this.translationZN.up = new THREE.Vector3(0, 1, 0);

    this.add(this.translationXP);
    this.add(this.translationYP);
    this.add(this.translationZP);

    this.add(this.translationXN);
    this.add(this.translationYN);
    this.add(this.translationZN);
  };

  private setupRotation = () => {
    this.rotationX.name = HANDLE_NAMES.XR;
    this.rotationY.name = HANDLE_NAMES.YR;
    this.rotationZ.name = HANDLE_NAMES.ZR;

    this.rotationX.up = new THREE.Vector3(1, 0, 0);
    this.rotationY.up = new THREE.Vector3(0, 1, 0);
    this.rotationZ.up = new THREE.Vector3(0, 0, 1);

    this.rotationX.rotateY(Math.PI / 2);
    this.rotationX.rotateZ(Math.PI);
    this.rotationY.rotateX(Math.PI / 2);

    this.add(this.rotationX);
    this.add(this.rotationY);
    this.add(this.rotationZ);
  };

  private computeObjectBounds = () => {
    if (this.separationT !== undefined) {
      const { x, y, z } = this.separationT;
      this.minBox.copy(new THREE.Vector3(-x / 2, -y / 2, -z / 2));
      this.maxBox.copy(new THREE.Vector3(x / 2, y / 2, z / 2));
    } else if (this.object.type === "Mesh") {
      const geometry = (this.object as THREE.Mesh).geometry;
      geometry.computeBoundingBox();
      const {
        boundingBox: { min, max }
      } = geometry;
      this.minBox.copy(min);
      this.maxBox.copy(max);

      this.minBox.addScalar(-DEFAULT_TRANSLATION_CONTROLS_SEPARATION);
      this.maxBox.addScalar(DEFAULT_TRANSLATION_CONTROLS_SEPARATION);
    } else {
      this.minBox.copy(new THREE.Vector3(-1, -1, -1));
      this.maxBox.copy(new THREE.Vector3(1, 1, 1));
    }
  };

  processDragStart = (args: { point: THREE.Vector3; handle: IHandle }) => {
    const { point, handle } = args;
    this.dragStartPoint.copy(point);
    this.dragIncrementalStartPoint.copy(point);
    this.isBeingDraggedTranslation =
      handle instanceof Translation || handle instanceof Pick || handle instanceof PickPlane;
    this.isBeingDraggedRotation = handle instanceof Rotation;
  };

  processHandle = (args: { point: THREE.Vector3; handle: IHandle }) => {
    const { point, handle } = args;
    if (handle instanceof Translation || handle instanceof Pick || handle instanceof PickPlane) {
      if (handle.name === HANDLE_NAMES.XT) {
        this.position.x += point.x - this.dragIncrementalStartPoint.x;
      } else if (handle.name === HANDLE_NAMES.YT) {
        this.position.y += point.y - this.dragIncrementalStartPoint.y;
      } else if (handle.name === HANDLE_NAMES.ZT) {
        this.position.z += point.z - this.dragIncrementalStartPoint.z;
      } else if (handle.name === HANDLE_NAMES.PICK) {
        this.position.x += point.x - this.dragIncrementalStartPoint.x;
        this.position.y += point.y - this.dragIncrementalStartPoint.y;
        this.position.z += point.z - this.dragIncrementalStartPoint.z;
      } else if (handle.name === HANDLE_NAMES.PICK_PLANE_XY) {
        this.position.x += point.x - this.dragIncrementalStartPoint.x;
        this.position.y += point.y - this.dragIncrementalStartPoint.y;
      } else if (handle.name === HANDLE_NAMES.PICK_PLANE_YZ) {
        this.position.y += point.y - this.dragIncrementalStartPoint.y;
        this.position.z += point.z - this.dragIncrementalStartPoint.z;
      } else if (handle.name === HANDLE_NAMES.PICK_PLANE_ZX) {
        this.position.x += point.x - this.dragIncrementalStartPoint.x;
        this.position.z += point.z - this.dragIncrementalStartPoint.z;
      }
    } else {
      this.touch1
        .copy(this.dragStartPoint)
        .sub(this.position)
        .normalize();
      this.touch2
        .copy(point)
        .sub(this.position)
        .normalize();

      this.touch1 // touch1 can be reused
        .copy(this.dragIncrementalStartPoint)
        .sub(this.position)
        .normalize();
      this.handleTargetQuaternion.setFromUnitVectors(this.touch1, this.touch2);
      this.handleTargetEuler.setFromQuaternion(this.handleTargetQuaternion);

      if (handle.name === HANDLE_NAMES.XR) {
        this.deltaQuaternion.setFromAxisAngle(handle.up, this.handleTargetEuler.x);
        handle.rotation.x += this.handleTargetEuler.x;
      } else if (handle.name === HANDLE_NAMES.YR) {
        this.deltaQuaternion.setFromAxisAngle(handle.up, this.handleTargetEuler.y);
        handle.rotation.z += -this.handleTargetEuler.y;
      } else if (handle.name === HANDLE_NAMES.ZR) {
        this.deltaQuaternion.setFromAxisAngle(handle.up, this.handleTargetEuler.z);
        handle.rotation.z += this.handleTargetEuler.z;
      }
    }

    this.objectTargetQuaternion.premultiply(this.deltaQuaternion);
    this.dragIncrementalStartPoint.copy(point);
  };

  private detachObjectUpdatePositionAttach = (
    parent: THREE.Object3D | null,
    object: THREE.Object3D
  ) => {
    if (parent !== null && this.parent !== null && this.parent.parent !== null) {
      const scene = this.parent.parent;
      if (scene.type !== "Scene") {
        throw new Error("freeform controls must be attached to the scene");
      }
      scene.attach(object);
      object.position.copy(this.objectTargetPosition);
      parent.attach(object);
    }
  };

  public showXT = (visibility = true) => {
    this.translationXP.visible = visibility;
    this.translationXN.visible = visibility;
  };

  public showYT = (visibility = true) => {
    this.translationYP.visible = visibility;
    this.translationYN.visible = visibility;
  };

  public showZT = (visibility = true) => {
    this.translationZP.visible = visibility;
    this.translationZN.visible = visibility;
  };

  public showXR = (visibility = true) => {
    this.rotationX.visible = visibility;
  };

  public showYR = (visibility = true) => {
    this.rotationY.visible = visibility;
  };

  public showZR = (visibility = true) => {
    this.rotationZ.visible = visibility;
  };

  public showPickT = (visibility = true) => {
    this.pick.visible = visibility;
  };

  public showPickPlaneXYT = (visibility = true) => {
    this.pickPlaneXY.visible = visibility;
  };

  public showPickPlaneYZT = (visibility = true) => {
    this.pickPlaneYZ.visible = visibility;
  };

  public showPickPlaneZXT = (visibility = true) => {
    this.pickPlaneZX.visible = visibility;
  };

  public showAll = (visibility = true) => {
    this.showXT(visibility);
    this.showYT(visibility);
    this.showZT(visibility);

    this.showXR(visibility);
    this.showYR(visibility);
    this.showZR(visibility);

    this.showPickT(visibility);

    this.showPickPlaneXYT(visibility);
    this.showPickPlaneYZT(visibility);
    this.showPickPlaneZXT(visibility);
  };

  public getInteractiveObjects(): THREE.Object3D[] {
    return [
      ...this.translationXP.getInteractiveObjects(),
      ...this.translationYP.getInteractiveObjects(),
      ...this.translationZP.getInteractiveObjects(),
      ...this.translationXN.getInteractiveObjects(),
      ...this.translationYN.getInteractiveObjects(),
      ...this.translationZN.getInteractiveObjects(),
      ...this.rotationX.getInteractiveObjects(),
      ...this.rotationY.getInteractiveObjects(),
      ...this.rotationZ.getInteractiveObjects(),
      ...this.pick.getInteractiveObjects(),
      ...this.pickPlaneXY.getInteractiveObjects(),
      ...this.pickPlaneYZ.getInteractiveObjects(),
      ...this.pickPlaneZX.getInteractiveObjects()
    ];
  }

  updateMatrixWorld = (force?: boolean) => {
    this.object.updateMatrixWorld(force);

    this.object.getWorldPosition(this.objectWorldPosition);
    const parent = this.object.parent;
    if (parent !== null) {
      parent.matrixWorld.decompose(
        this.objectParentWorldPosition,
        this.objectParentWorldQuaternion,
        this.objectParentWorldScale
      );
    }
    this.objectParentWorldQuaternion.inverse();
    this.objectTargetPosition.copy(this.position);
    this.objectTargetQuaternion.premultiply(this.objectParentWorldQuaternion);

    if (this.isBeingDraggedTranslation) {
      this.detachObjectUpdatePositionAttach(parent, this.object);
    } else if (this.isBeingDraggedRotation) {
      this.object.quaternion.copy(this.objectTargetQuaternion);
      this.detachObjectUpdatePositionAttach(parent, this.object);
    } else {
      this.position.copy(this.objectWorldPosition);
    }

    this.object.getWorldQuaternion(this.objectTargetQuaternion);

    super.updateMatrixWorld(force);
  };
}
