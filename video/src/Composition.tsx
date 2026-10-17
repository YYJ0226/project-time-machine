import type { CSSProperties } from "react";
import { Audio } from "@remotion/media";
import {
  Easing,
  Interactive,
  interpolate,
  staticFile,
  Track,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BasicCaptions } from "./basic-captions";

type EvidenceCardProps = {
  title: string;
  label: string;
  accent: string;
  style?: CSSProperties;
};

const EvidenceCardInner = ({
  title,
  label,
  accent,
  style,
}: EvidenceCardProps) => (
  <div
    style={{
      width: 470,
      height: 176,
      padding: "30px 34px",
      boxSizing: "border-box",
      background: "#0d1c2c",
      border: "1px solid #294152",
      borderRadius: 16,
      boxShadow: "0 24px 80px #00000045",
      fontFamily: '"Microsoft YaHei", sans-serif',
      ...style,
    }}
  >
    <div
      style={{
        fontFamily: "Consolas, monospace",
        fontSize: 25,
        letterSpacing: 3,
        color: accent,
      }}
    >
      {label}
    </div>
    <div
      style={{ fontSize: 48, marginTop: 15, fontWeight: 600, color: "#eaf2f5" }}
    >
      {title}
    </div>
  </div>
);

export const EvidenceCard = Interactive.create({
  Component: EvidenceCardInner,
  layout: "none",
  schema: {
    title: { type: "string", default: "需求", description: "Evidence label" },
    label: {
      type: "string",
      default: "01 / ISSUE",
      description: "Evidence kind",
    },
    accent: { type: "color", default: "#64d8d1", description: "Accent" },
  },
});

const OpeningInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 80% 15%, #163b4b 0%, #07111f 60%)",
          fontFamily: '"Microsoft YaHei", sans-serif',
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(#6bacc809 1px, transparent 1px), linear-gradient(90deg, #6bacc809 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <Interactive.Div
        name="Editorial eyebrow"
        style={{
          position: "absolute",
          left: 160,
          top: 100,
          fontFamily: "Consolas, monospace",
          fontSize: 27,
          letterSpacing: 5,
          color: "#8da9bc",
        }}
      >
        PROJECT TIME MACHINE / RESEARCH DEMO
      </Interactive.Div>
      <Interactive.Div
        name="Opening question"
        style={{
          position: "absolute",
          left: 160,
          top: 220,
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: 110,
          lineHeight: 1.28,
          fontWeight: 700,
          color: "#eaf2f5",
          opacity: interpolate(
            frame,
            [0, 0.6 * fps, 8 * fps, 9 * fps],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: interpolate(frame, [0, 1 * fps], ["0px 30px", "0px 0px"], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        代码完成，
        <br />
        <span style={{ color: "#64d8d1" }}>过程在哪里？</span>
      </Interactive.Div>
      <Interactive.Div
        name="Product reveal"
        style={{
          position: "absolute",
          left: 160,
          top: 220,
          fontFamily: '"Microsoft YaHei", sans-serif',
          color: "#eaf2f5",
          opacity: interpolate(frame, [8.5 * fps, 9.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [8.5 * fps, 9.5 * fps],
            ["0px 25px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        <div style={{ fontSize: 110, lineHeight: 1.3, fontWeight: 700 }}>
          项目时光机
        </div>
        <div style={{ fontSize: 65, marginTop: 24, color: "#64d8d1" }}>
          让开发过程，可回看 · 可核验
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="Evidence connector"
        style={{
          position: "absolute",
          left: 180,
          top: 708,
          height: 2,
          backgroundColor: "#64d8d1",
          boxShadow: "0 0 20px #64d8d14d",
          width: interpolate(frame, [4.5 * fps, 7.5 * fps], [0, 1480], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          opacity: interpolate(frame, [4.3 * fps, 5 * fps], [0, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <EvidenceCard
        name="Requirement card"
        title="为什么做"
        label="01 / ISSUE"
        accent="#b5a5ef"
        style={{
          position: "absolute",
          left: 160,
          top: 620,
          opacity: interpolate(frame, [1 * fps, 1.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [1 * fps, 1.6 * fps, 4.5 * fps, 6 * fps],
            ["-25px 20px", "0px 20px", "0px 20px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          rotate: interpolate(frame, [4.5 * fps, 6 * fps], ["-7deg", "0deg"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <EvidenceCard
        name="Implementation card"
        title="改了什么"
        label="02 / COMMIT"
        accent="#64d8d1"
        style={{
          position: "absolute",
          left: 725,
          top: 620,
          opacity: interpolate(frame, [1.4 * fps, 2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [1.4 * fps, 2 * fps, 4.9 * fps, 6.4 * fps],
            ["0px -50px", "0px -80px", "0px -80px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          rotate: interpolate(frame, [4.9 * fps, 6.4 * fps], ["5deg", "0deg"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <EvidenceCard
        name="Verification card"
        title="如何验证"
        label="03 / CI"
        accent="#edbb7b"
        style={{
          position: "absolute",
          left: 1290,
          top: 620,
          opacity: interpolate(frame, [1.8 * fps, 2.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [1.8 * fps, 2.4 * fps, 5.3 * fps, 6.8 * fps],
            ["25px 65px", "0px 40px", "0px 40px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          rotate: interpolate(
            frame,
            [5.3 * fps, 6.8 * fps],
            ["-4deg", "0deg"],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      />
      <BasicCaptions
        name="Visual story captions"
        width={1660}
        combineTokensWithinMilliseconds={0}
        style={{ position: "absolute", left: 130, top: 872 }}
        captions={[
          {
            text: "代码完成，不等于过程清楚。",
            startMs: 500,
            endMs: 3800,
            timestampMs: null,
            confidence: null,
            pageBreakAfter: true,
          },
          {
            text: "把需求、实现和验证，连起来。",
            startMs: 4000,
            endMs: 8800,
            timestampMs: null,
            confidence: null,
            pageBreakAfter: true,
          },
          {
            text: "一条可回看、可核验的时间线。",
            startMs: 9000,
            endMs: 14500,
            timestampMs: null,
            confidence: null,
            pageBreakAfter: true,
          },
        ]}
      />
      <Interactive.Div
        name="Audition disclosure"
        style={{
          position: "absolute",
          left: 160,
          bottom: 42,
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: 25,
          color: "#849aad",
        }}
      >
        概念动画 · 非产品录屏 / 原创合成配乐 · 无口播
      </Interactive.Div>
      <Interactive.Div
        name="Chapter marker"
        style={{
          position: "absolute",
          right: 160,
          bottom: 42,
          fontFamily: "Consolas, monospace",
          fontSize: 25,
          color: "#849aad",
        }}
      >
        01 / MOTIVATION
      </Interactive.Div>
      <Audio
        name="Original Evidence Pulse music"
        src={staticFile("audio/music-v1/evidence-pulse.wav")}
        volume={0.75}
      />
    </>
  );
};

export const Opening = Interactive.create({
  Component: OpeningInner,
  layout: "absolute-fill",
});

export const CourseOpening = () => {
  const { fps } = useVideoConfig();
  return (
    <Track name="Opening scene">
      <Opening name="From fragments to evidence" durationInFrames={15 * fps} />
    </Track>
  );
};
