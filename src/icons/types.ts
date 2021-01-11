import { CSSProperties } from "react";

export type IconProps = {
  width: number;
  height: number;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
};
