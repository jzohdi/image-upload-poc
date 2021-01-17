import { CSSProperties, PropsWithChildren } from "react";

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

type ContainerProps = {
  maxWidth: "xs" | "sm" | "md" | "lg" | "xl";
  style?: CSSProperties;
  className?: string;
};
const widthMap = {
  xs: 600,
  sm: 960,
  md: 1280,
  lg: 1920,
  xl: 2400,
};
export function Container({
  children,
  maxWidth,
  style,
  className,
}: PropsWithChildren<ContainerProps>) {
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        ...style,
        display: "relative",
      }}
      className={className}
    >
      <div style={{ margin: "auto", maxWidth: widthMap[maxWidth] }}>
        {children}
      </div>
    </div>
  );
}
