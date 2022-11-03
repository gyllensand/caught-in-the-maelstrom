import { OrbitControls, useTexture } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { SpringValue, useSpring } from "@react-spring/three";
import {
  MutableRefObject,
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
  pickRandom,
  pickRandomIntFromInterval,
  pickRandomNumber,
} from "./utils";
import {
  BORDER_COLORS,
  DARK_BG_COLORS,
  DARK_COLORS,
  LIGHT_BG_COLORS,
  LIGHT_COLORS,
} from "./constants";
import { Destination, Filter, start } from "tone";
import { CHORDS, Sample } from "./App";

declare const fxpreview: () => void;

extend({ MeshLine, MeshLineMaterial });

interface LineData {
  index: number;
  curve: Vector2[];
  visibleLength: number;
  width: number;
  color: string;
  speed: number;
}

export const CAMERA_Z = 6;

const LINE_COUNT = pickRandomIntFromInterval(200, 300);
const SPEEDS = pickRandom([
  [0.001, 0.005],
  [0.001, 0.005],
  [0.0009, 0.0049],
  [0.0008, 0.0048],
  [0.0007, 0.0047],
]);
const LENGTHS = pickRandom([
  [0.1, 0.4],
  [0.1, 0.4],
  [0.3, 0.6],
  [0.5, 0.8],
]);
const WIDTHS = pickRandom([
  [0.01, 0.06],
  [0.01, 0.06],
  [0.02, 0.07],
  [0.03, 0.08],
  [0.04, 0.09],
  [0.05, 0.1],
]);

const WIDTH_GROWTH = pickRandomDecimalFromInterval(1.5, 5);
const RADIUS_START = pickRandomDecimalFromInterval(0.3, 0.8);
const Z_INCREMENT = pickRandomDecimalFromInterval(0.05, 0.1);
const ANGLE_INCREMENT = pickRandomDecimalFromInterval(0.01, 0.05);
const RADIUS_INCREMENT = pickRandomDecimalFromInterval(0.01, 0.04);

const WIREFRAME = pickRandom([
  ...new Array(9).fill(null).map(() => false),
  true,
]);
const USE_TEXTURE = pickRandom([true, false]);
const REVERSE_ANGLE = pickRandom([true, false]);
const IS_IRREGULAR_ANGLE = ANGLE_INCREMENT < 0.02 && pickRandom([false, true]);
const IRREGULAR_ANGLE = pickRandomDecimalFromInterval(1, 3);
const IS_POSITION_OFFSET = pickRandom([false, true]);
const POSITION_OFFSET = IS_POSITION_OFFSET
  ? [pickRandomDecimalFromInterval(-2, 2), pickRandomDecimalFromInterval(-2, 2)]
  : [0, 0];

const BG_THEME = pickRandom([0, 1, 1, 1, 1]);
const DARK_BG = BG_THEME === 1;
const BG_COLOR = pickRandom(DARK_BG ? DARK_BG_COLORS : LIGHT_BG_COLORS);
export const BORDER_COLOR = pickRandom(
  BORDER_COLORS.filter((o) => o !== BG_COLOR)
);
const LINE_THEME = DARK_BG ? LIGHT_COLORS : DARK_COLORS;
const PRIMARY_COLOR = pickRandom(LINE_THEME);
const SECONDARY_COLOR = pickRandom(LINE_THEME);
const TERTIARY_COLOR = pickRandom(LINE_THEME);
const MIXED_LINE_COLORS = pickRandom([60, 90]);
const SINGLE_LINE_COLORS = pickRandom([
  ...new Array(9).fill(null).map(() => false),
  true,
]);

// @ts-ignore
window.$fxhashFeatures = {
  lineCount: LINE_COUNT,
  wireframe: WIREFRAME,
  bgColor: BG_COLOR,
  borderColor: BORDER_COLOR,
  lineColor: SINGLE_LINE_COLORS
    ? PRIMARY_COLOR
    : [PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR].join(),
};

console.log("WIDTHS", WIDTHS);
console.log("SPEEDS", SPEEDS);
console.log("LENGTHS", LENGTHS);
console.log("MIXED_LINE_COLORS", MIXED_LINE_COLORS);
console.log("SINGLE_LINE_COLORS", SINGLE_LINE_COLORS);
console.log("BG_COLOR", BG_COLOR);
console.log("WIDTH_GROWTH", WIDTH_GROWTH);
console.log("RADIUS_START", RADIUS_START);
console.log("Z_INCREMENT", Z_INCREMENT);
console.log("ANGLE_INCREMENT", ANGLE_INCREMENT);
console.log("RADIUS_INCREMENT", RADIUS_INCREMENT);
console.log("IRREGULAR_ANGLE", IRREGULAR_ANGLE);

function Fatline({
  index,
  curve,
  visibleLength,
  width,
  color,
  speed,
  texture,
  speedSpring,
  lineWidthSpring,
  previewIndexes,
  hasRunPreview,
}: LineData & {
  texture: { map: Texture };
  speedSpring: SpringValue<number>;
  lineWidthSpring: SpringValue<number>;
  previewIndexes: number[];
  hasRunPreview: MutableRefObject<boolean>;
}) {
  const ref = useRef<InstancedMesh<MeshLine>>(null);
  const updatedCurve = useRef<number[]>([]);
  let x = useRef(0);
  let y = useRef(0);
  let z = useRef(-1);
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
    if (IS_POSITION_OFFSET) {
      x.current += POSITION_OFFSET[0] / 100;
      y.current += POSITION_OFFSET[1] / 100;
    }

    z.current += Z_INCREMENT;

    const anglePath = IS_IRREGULAR_ANGLE
      ? Math.sin(z.current * IRREGULAR_ANGLE) * ANGLE_INCREMENT
      : ANGLE_INCREMENT;

    REVERSE_ANGLE ? (angle.current -= anglePath) : (angle.current += anglePath);

    radius.current += RADIUS_INCREMENT;

    updatedCurve.current.push(
      Math.cos(angle.current) * radius.current - x.current,
      Math.sin(angle.current) * radius.current - y.current,
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

  const resetLine = useCallback(() => {
    // @ts-ignore
    ref.current.material.uniforms.dashOffset.value = 0;
    // @ts-ignore
    ref.current.material.uniforms.opacity.value = 1;
  }, []);

  useLayoutEffect(() => {
    const widthGrow = WIREFRAME ? WIDTH_GROWTH * 2 : WIDTH_GROWTH;

    ref.current!.geometry.setFromPoints(curve);
    ref.current!.geometry.setPoints(updatedCurve.current, (p: number) =>
      WIDTH_GROWTH > 3 ? Math.sin(p * widthGrow) : p * widthGrow
    );
  }, [curve, index, speed]);

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }

    // @ts-ignore
    if (ref.current.material.uniforms.dashOffset.value < -diedAt) {
      resetLine();
    }

    // @ts-ignore
    if (ref.current.material.uniforms.dashOffset.value < -dyingAt) {
      // @ts-ignore
      ref.current.material.uniforms.opacity.value =
        1 +
        // @ts-ignore
        (ref.current.material.uniforms.dashOffset.value + dyingAt) / dashLength;
    }

    // @ts-ignore
    if (ref.current.material.uniforms.dashOffset.value < -dyingAt / 1.5) {
      if (
        previewIndexes.find((o) => o === index) !== undefined &&
        !hasRunPreview.current
      ) {
        hasRunPreview.current = true;
        fxpreview();
      }
    }

    if (clock.getElapsedTime() > (index / 1000) * 20) {
      // @ts-ignore
      ref.current.material.uniforms.dashOffset.value -=
        speed + speedSpring.get();

      // @ts-ignore
      ref.current.material.uniforms.lineWidth.value =
        // @ts-ignore
        width + lineWidthSpring.get();
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
    index,
    color: SINGLE_LINE_COLORS
      ? PRIMARY_COLOR
      : pickRandomColorWithTheme(colorSplit, LINE_THEME, MIXED_LINE_COLORS),
    visibleLength: pickRandomDecimalFromInterval(LENGTHS[0], LENGTHS[1]),
    width: pickRandomDecimalFromInterval(WIDTHS[0], WIDTHS[1]),
    speed: pickRandomDecimalFromInterval(SPEEDS[0], SPEEDS[1], 4),
    curve,
  };
};

const lineShapes = new Array(LINE_COUNT)
  .fill(null)
  .map((_, i) => generateLine(LINE_COUNT, i));

const Scene = ({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) => {
  const toneInitialized = useRef(false);
  const lowpassFilter = useRef(new Filter(20000, "lowpass"));

  const texture = useTexture({
    map: `${process.env.PUBLIC_URL}/stroke.png`,
  });

  const [lastPlayedSample, setLastPlayedSample] = useState<Sample>();
  const availableChords = useMemo(
    () => CHORDS.filter(({ index }) => index !== lastPlayedSample?.index),
    [lastPlayedSample]
  );

  useEffect(() => {
    if (lastPlayedSample && lastPlayedSample.sampler.loaded) {
      CHORDS.filter(({ sampler }) => sampler.triggerRelease("C#-1", "+0.2"));
      lastPlayedSample.sampler.triggerAttack("C#-1");
    }
  }, [lastPlayedSample]);

  useEffect(() => {
    CHORDS.forEach((chord) => {
      chord.sampler.chain(lowpassFilter.current, Destination);
    });
  }, []);

  const [{ speed }, setSpeed] = useSpring(() => ({
    speed: 0,
  }));

  const [{ lineWidth }, setLineWidth] = useSpring(() => ({
    lineWidth: 0,
  }));

  const [{ lowpass }, setLowpass] = useSpring(() => ({
    lowpass: 0,
  }));

  const onPointerDown = useCallback(() => {
    setSpeed.start({ speed: -0.0075 });
    setLowpass.start({
      lowpass: 1,
      config: {
        mass: 1,
        tension: 280,
        friction: 100,
      },
    });
  }, [setSpeed, setLowpass]);

  const onPointerUp = useCallback(async () => {
    setSpeed.start({
      from: { speed: 0.015 },
      to: { speed: 0 },
      config: {
        mass: 1,
        tension: 280,
        friction: 200,
      },
    });
    setLineWidth.start({
      from: { lineWidth: lineWidth.get() },
      to: { lineWidth: 0.05 },
      config: {
        mass: 1,
        tension: 280,
        friction: 20,
      },
      onRest: () => {
        setLineWidth.start({
          from: { lineWidth: lineWidth.get() },
          to: { lineWidth: 0 },
          config: {
            mass: 1,
            tension: 280,
            friction: 100,
          },
        });
      },
    });
    setLowpass.start({
      lowpass: 0,
      config: {
        mass: 1,
        tension: 280,
        friction: 300,
      },
    });

    if (!toneInitialized.current) {
      await start();
      toneInitialized.current = true;
    }

    const currentSampler = pickRandom(availableChords);
    setLastPlayedSample(currentSampler);
  }, [setSpeed, setLowpass, availableChords, lineWidth, setLineWidth]);

  useFrame(() => {
    lowpassFilter.current.frequency.value = 20000 - lowpass.get() * 19900;
  });

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

  const previewIndexes = useMemo<number[]>(() => [], []);
  useEffect(() => {
    const max = Math.max(...lineShapes.map((o) => o.speed));

    for (let index = 0; index < lineShapes.length; index++) {
      if (lineShapes[index].speed === max) {
        previewIndexes.push(index);
      }
    }
  }, [previewIndexes]);
  const hasRunPreview = useRef(false);

  return (
    <>
      <color attach="background" args={[BG_COLOR]} />
      <OrbitControls enabled={false} />
      <group position={[POSITION_OFFSET[0], POSITION_OFFSET[1], 0]}>
        {lineShapes.map((props, i) => (
          <Fatline
            key={i}
            {...props}
            texture={texture}
            speedSpring={speed}
            lineWidthSpring={lineWidth}
            previewIndexes={previewIndexes}
            hasRunPreview={hasRunPreview}
          />
        ))}
      </group>
    </>
  );
};

export default Scene;
