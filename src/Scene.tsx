import { OrbitControls, Stats } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import {
  RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { MeshLine, MeshLineMaterial } from "meshline";
import { Vector3, SplineCurve, Vector2, InstancedMesh } from "three";
import {
  generateUUID,
  pickRandomDecimalFromInterval,
  pickRandomNumber,
} from "./utils";

extend({ MeshLine, MeshLineMaterial });

interface LineData {
  id: string;
  curve: Vector2[];
  visibleLength: number;
  width: number;
  color: string;
  speed: number;
}

const initialCount = 400;
const lineShapes = new Array(initialCount)
  .fill(null)
  .map(() => generateLine(initialCount));

export const CAMERA_Z = 6;
const RADIUS_START = 0.3;
const RADIUS_START_MIN = 0.1;
const Z_MIN = -1;

const Z_INCREMENT = 0.08;
const ANGLE_INCREMENT = 0.025;
const RADIUS_INCREMENT = 0.02;

function Fatline({
  id,
  index,
  curve,
  visibleLength,
  width,
  color,
  speed,
}: LineData & { index: number }) {
  const ref = useRef<InstancedMesh<MeshLine>>(null);
  const updatedCurve = useRef<number[]>([]);
  let z = useRef(Z_MIN);
  let radius = useRef(
    pickRandomNumber() > 0.8 ? RADIUS_START_MIN : RADIUS_START
  );
  let angle = useRef(pickRandomDecimalFromInterval(0, Math.PI * 2));

  while (z.current < CAMERA_Z) {
    z.current += Z_INCREMENT;
    angle.current += ANGLE_INCREMENT;
    radius.current += RADIUS_INCREMENT;

    updatedCurve.current.push(
      Math.cos(angle.current) * radius.current,
      Math.sin(angle.current) * radius.current,
      z.current
    );
  }

  const dashArray = useMemo(() => 2, []);
  const dashOffset = useMemo(() => 0, []);
  const dashRatio = useMemo(() => 1 - visibleLength * 0.5, [visibleLength]);
  const voidLength = useMemo(
    () => dashArray * dashRatio,
    [dashArray, dashRatio]
  );
  const dashLength = useMemo(
    () => dashArray - voidLength,
    [dashArray, voidLength]
  );
  const dyingAt = useMemo(() => 1, []);
  const diedAt = useMemo(() => dyingAt + dashLength, [dyingAt, dashLength]);
  const hasStarted = useRef(false);

  const resetLine = useCallback(() => {
    // @ts-ignore
    ref.current.material.uniforms.dashOffset.value = 0;
    // @ts-ignore
    ref.current.material.uniforms.opacity.value = 1;
  }, []);

  useLayoutEffect(() => {
    ref.current!.geometry.setFromPoints(curve);
    ref.current!.geometry.setPoints(
      updatedCurve.current,
      (p: number) => p * 1.5
    );

    setTimeout(() => {
      hasStarted.current = true;
    }, index * 20);
  }, [curve, index]);

  useFrame(() => {
    if (!ref.current) {
      return;
    }

    // @ts-ignore
    if (ref.current.material.uniforms.dashOffset.value < -diedAt) {
      resetLine();
      return;
    }

    // @ts-ignore
    if (ref.current.material.uniforms.dashOffset.value < -dyingAt) {
      // @ts-ignore
      ref.current.material.uniforms.opacity.value =
        0.9 +
        // @ts-ignore
        (ref.current.material.uniforms.dashOffset.value + dyingAt) / dashLength;
    }

    if (hasStarted.current) {
      // @ts-ignore
      ref.current.material.uniforms.dashOffset.value -= speed;
    }
  });

  return (
    <mesh ref={ref}>
      {/*
      // @ts-ignore */}
      <meshLine attach="geometry" />
      {/*
      // @ts-ignore */}
      <meshLineMaterial
        attach="material"
        transparent
        depthWrite={false}
        lineWidth={width}
        color={color}
        dashArray={dashArray}
        dashOffset={dashOffset}
        dashRatio={dashRatio}
      />
    </mesh>
  );
}

const generateLine = (count: number): LineData => {
  const orientation = new Vector3(1, 0, 0);
  const turbulence = new Vector3(0, 0, 0);
  const length = 2;
  const currentPoint = new Vector3();
  const segment = orientation.normalize().multiplyScalar(length / count);
  const linePoints = [currentPoint.clone()];

  for (let i = 0; i < count - 1; i++) {
    currentPoint.add(segment);

    linePoints.push(
      currentPoint
        .clone()
        .set(
          currentPoint.x +
            pickRandomDecimalFromInterval(-turbulence.x, turbulence.x),
          currentPoint.y +
            pickRandomDecimalFromInterval(-turbulence.y, turbulence.y),
          currentPoint.z +
            pickRandomDecimalFromInterval(-turbulence.z, turbulence.z)
        )
    );
  }

  linePoints.push(currentPoint.add(segment).clone());

  // @ts-ignore
  const curve = new SplineCurve(linePoints).getPoints(50);

  return {
    id: generateUUID(),
    // color: colors[parseInt(colors.length * pickRandomNumber())],
    color: "red",
    visibleLength: pickRandomDecimalFromInterval(0.1, 0.4),
    width: pickRandomDecimalFromInterval(0.01, 0.06),
    speed: pickRandomDecimalFromInterval(0.001, 0.005, 3),
    curve,
  };
};

const Scene = ({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) => {
  const { aspect, renderer } = useThree((state) => ({
    aspect: state.viewport.aspect,
    renderer: state.gl.info.render,
  }));

  return (
    <>
      <Stats />
      <OrbitControls enabled={true} />

      {lineShapes.map((props, i) => (
        <Fatline key={i} index={i} {...props} />
      ))}
    </>
  );
};

export default Scene;
