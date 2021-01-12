import { CSSProperties } from "react";

type SpacerProps = {
  width?: number | string;
  height?: number | string;
};
export function Spacer({ width, height }: SpacerProps) {
  return (
    <div style={{ width: width || "100%", height: height || "100%" }}></div>
  );
}

export function Divider({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        width: "100%",
        height: "1px",
        backgroundColor: "#c5c5c5",
        ...style,
      }}
    ></div>
  );
}
