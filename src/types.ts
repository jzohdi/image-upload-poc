import { TimeStamp } from "./hooks/firebase";

export const GALLERY_COLLECTION = "galleries";

export type GalleryImage = {
  id: string;
  value: string;
  createdAt: TimeStamp;
  disabled: boolean;
  dimensions?: {
    w: number;
    h: number;
  };
};

export type Gallery = {
  id: string;
  value: string;
  createdAt: TimeStamp;
  disabled: boolean;
};
