import { OrbitControls, Stats, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { a, SpringValue, useSpring } from "@react-spring/three";
import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MeshLine, MeshLineMaterial } from "meshline";
import {
  Vector3,
  SplineCurve,
  Vector2,
  InstancedMesh,
  Texture,
  AdditiveBlending,
  NormalBlending,
} from "three";
import {
  pickRandomColorWithTheme,
  pickRandomDecimalFromInterval,
  pickRandomHash,
  pickRandomIntFromInterval,
  pickRandomNumber,
} from "./utils";
import {
  DARK_BG_COLORS,
  DARK_COLORS,
  LIGHT_BG_COLORS,
  LIGHT_COLORS,
} from "./constants";

extend({ MeshLine, MeshLineMaterial });

interface LineData {
  curve: Vector2[];
  visibleLength: number;
  width: number;
  color: string;
  speed: number;
}

export const CAMERA_Z = 6;
const Z_MIN = -1;

const LINE_COUNT = pickRandomIntFromInterval(150, 200);
const SPEEDS = pickRandomHash([
  [0.001, 0.005],
  [0.001, 0.005],
  [0.0009, 0.005],
  [0.0008, 0.005],
  [0.0007, 0.005],
]);
const LENGTHS = pickRandomHash([
  [0.1, 0.4],
  [0.1, 0.4],
  [0.3, 0.6],
  [0.5, 0.8],
]);
const WIDTHS = pickRandomHash([
  [0.01, 0.06],
  [0.01, 0.06],
  [0.02, 0.07],
]);

const WIDTH_GROWTH = pickRandomDecimalFromInterval(1.5, 6.5);
const RADIUS_START = pickRandomDecimalFromInterval(0.3, 0.8);
const Z_INCREMENT = pickRandomDecimalFromInterval(0.05, 0.1);
const ANGLE_INCREMENT = pickRandomDecimalFromInterval(0.01, 0.05);
const RADIUS_INCREMENT = pickRandomDecimalFromInterval(0.01, 0.04);

const WIREFRAME = pickRandomHash([
  ...new Array(9).fill(null).map(() => false),
  true,
]);
const USE_TEXTURE = pickRandomHash([true, false]);
const REVERSE_ANGLE = pickRandomHash([true, false]);
const IS_IRREGULAR_ANGLE = pickRandomHash([false, false, true]);
const IRREGULAR_ANGLE = pickRandomDecimalFromInterval(1, 3);

const BG_THEME = pickRandomHash([0, 1, 1, 1]);
const DARK_BG = BG_THEME === 1;
const BG_COLOR = pickRandomHash(DARK_BG ? DARK_BG_COLORS : LIGHT_BG_COLORS);
const LINE_THEME = DARK_BG ? LIGHT_COLORS : DARK_COLORS;
const PRIMARY_COLOR = pickRandomHash(LINE_THEME);
const SECONDARY_COLOR = pickRandomHash(LINE_THEME);
const TERTIARY_COLOR = pickRandomHash(LINE_THEME);
const MIXED_LINE_COLORS = pickRandomHash([20, 20, 30, 30, 90]);
const SINGLE_LINE_COLORS = pickRandomHash([
  ...new Array(9).fill(null).map(() => false),
  true,
]);

console.log("MIXED_LINE_COLORS", MIXED_LINE_COLORS);
console.log("SINGLE_LINE_COLORS", SINGLE_LINE_COLORS);
console.log("BG_COLOR", BG_COLOR);
console.log("WIDTH_GROWTH", WIDTH_GROWTH);
console.log("RADIUS_START", RADIUS_START);
console.log("Z_INCREMENT", Z_INCREMENT);
console.log("ANGLE_INCREMENT", ANGLE_INCREMENT);
console.log("RADIUS_INCREMENT", RADIUS_INCREMENT);

function Fatline({
  index,
  curve,
  visibleLength,
  width,
  color,
  speed,
  texture,
  incrementor,
}: LineData & {
  index: number;
  texture: { map: Texture };
  incrementor: SpringValue<number>;
}) {
  const ref = useRef<InstancedMesh<MeshLine>>(null);
  const updatedCurve = useRef<number[]>([]);
  let z = useRef(Z_MIN);
  let radius = useRef(
    pickRandomNumber() > 0.8
      ? pickRandomDecimalFromInterval(
          RADIUS_START - 0.2 - 0.1,
          RADIUS_START - 0.2 + 0.1
        )
      : pickRandomDecimalFromInterval(RADIUS_START - 0.1, RADIUS_START + 0.1)
  );
  let angle = useRef(pickRandomDecimalFromInterval(0, Math.PI * 2));

  while (z.current < CAMERA_Z) {
    z.current += Z_INCREMENT;

    REVERSE_ANGLE
      ? (angle.current -= IS_IRREGULAR_ANGLE
          ? Math.sin(z.current * IRREGULAR_ANGLE) * ANGLE_INCREMENT
          : ANGLE_INCREMENT)
      : (angle.current += IS_IRREGULAR_ANGLE
          ? Math.sin(z.current * IRREGULAR_ANGLE) * ANGLE_INCREMENT
          : ANGLE_INCREMENT);

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
    // ref.current.material.uniforms.opacity.value = 1;
  }, []);

  useLayoutEffect(() => {
    const widthGrow = WIREFRAME ? WIDTH_GROWTH * 1.5 : WIDTH_GROWTH;

    ref.current!.geometry.setFromPoints(curve);
    ref.current!.geometry.setPoints(updatedCurve.current, (p: number) =>
      WIDTH_GROWTH > 4 ? Math.sin(p * widthGrow) : p * widthGrow
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

    // // @ts-ignore
    // if (ref.current.material.uniforms.dashOffset.value < -dyingAt) {
    //   // @ts-ignore
    //   ref.current.material.uniforms.opacity.value =
    //     0.9 +
    //     // @ts-ignore
    //     (ref.current.material.uniforms.dashOffset.value + dyingAt) / dashLength;
    // }

    if (hasStarted.current) {
      // @ts-ignore
      ref.current.material.uniforms.dashOffset.value -=
        speed + incrementor.get();
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
        wireframe={WIREFRAME}
        blending={DARK_BG ? AdditiveBlending : NormalBlending}
        useMap={USE_TEXTURE}
        {...texture}
      />
    </mesh>
  );
}

const generateLine = (count: number, index: number): LineData => {
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
  const colorSplit =
    index < count / 3
      ? PRIMARY_COLOR
      : index < count / 1.5
      ? SECONDARY_COLOR
      : TERTIARY_COLOR;

  return {
    color: SINGLE_LINE_COLORS
      ? PRIMARY_COLOR
      : pickRandomColorWithTheme(colorSplit, LINE_THEME, MIXED_LINE_COLORS),
    visibleLength: pickRandomDecimalFromInterval(LENGTHS[0], LENGTHS[1]),
    width: pickRandomDecimalFromInterval(WIDTHS[0], WIDTHS[1]),
    speed: pickRandomDecimalFromInterval(SPEEDS[0], SPEEDS[1], 3),
    curve,
  };
};

const lineShapes = new Array(LINE_COUNT)
  .fill(null)
  .map((_, i) => generateLine(LINE_COUNT, i));

const Scene = ({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) => {
  const { aspect } = useThree((state) => ({
    aspect: state.viewport.aspect,
  }));

  const texture = useTexture({
    map: `${process.env.PUBLIC_URL}/stroke.png`,
  });

  const [spring, setSpring] = useSpring(() => ({
    speed: 0,
  }));

  const onPointerDown = useCallback(() => {
    setSpring.start({ speed: 0.01 });
  }, [setSpring]);

  const onPointerUp = useCallback(() => {
    setSpring.start({
      from: { speed: 0.01 },
      to: { speed: 0 },
      config: {
        mass: 1,
        tension: 280,
        friction: 100,
      },
    });
  }, [setSpring]);

  useEffect(() => {
    const ref = canvasRef?.current;

    if (!ref) {
      return;
    }

    ref.addEventListener("pointerdown", onPointerDown);
    ref.addEventListener("pointerup", onPointerUp);

    return () => {
      ref.removeEventListener("pointerdown", onPointerDown);
      ref.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerDown, onPointerUp, canvasRef]);

  return (
    <>
      <Stats />
      <color attach="background" args={[BG_COLOR]} />
      <OrbitControls enabled={true} />
      {lineShapes.map((props, i) => (
        <Fatline
          key={i}
          index={i}
          {...props}
          texture={texture}
          incrementor={spring.speed}
        />
      ))}
    </>
  );
};

export default Scene;
