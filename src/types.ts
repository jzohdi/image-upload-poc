import { TimeStamp } from "./hooks/firebase";

export const GALLERY_COLLECTION = "galleries";
export const IMAGE_COLLECTION = "images";

export type GalleryImage = {
  id: string;
  src: string;
  createdAt: TimeStamp;
  disabled: boolean;
  width: number;
  height: number;
};

export type GalleryBackground = {
  id: string;
  width: number;
  height: number;
};

export type Gallery = {
  id: string;
  background: GalleryBackground;
  createdAt: TimeStamp;
  disabled: boolean;
  roles: {
    [key: string]: "owner" | "editor";
  };
};
