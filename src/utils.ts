export type ParsedSessionBackground = {
  base64: string;
  width: number;
  height: number;
};

export async function toBase64(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
}

async function fileToObjectUrl(file: File): Promise<string> {
  if (!isBrowser()) {
    throw new Error("compressImage is meant for use in the browser only.");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      const blob = new Blob([reader.result as ArrayBuffer]);
      const dataUrl = window.URL.createObjectURL(blob);
      resolve(dataUrl);
    };
    reader.onerror = (error) => reject(error);
  });
}

const TARGET_WIDTH = 800;
const MAX_HEIGHT = 400;
const MAX_FILE_SIZE = TARGET_WIDTH * MAX_HEIGHT;
const RESIZE_BY = 0.9; // scale down to 90% each step
const INVERSE = 1 / RESIZE_BY;

export async function compressImage(
  file: File
): Promise<ParsedSessionBackground | null> {
  if (!isBrowser()) {
    throw new Error("compressImage is meant for use in the browser only.");
  }
  const asUrl = await fileToObjectUrl(file);
  const asImage = await toImage(asUrl);

  // if the size of the image is already not too large, return the base64
  if (asImage.width * asImage.height > MAX_FILE_SIZE) {
    return resizeImage(asImage);
  }
  const base64 = await toBase64(file);
  if (!base64) {
    throw new Error("toBase64 failed on file.");
  }
  return { base64, width: asImage.width, height: asImage.height };
}

async function toImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, _) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = src;
  });
}

// linear interpolation to resize image
function resizeImage(img: HTMLImageElement): ParsedSessionBackground {
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d"),
    oc = document.createElement("canvas"),
    octx = oc.getContext("2d");

  if (!ctx || !octx) throw new Error("Could not resize image");

  canvas.width = TARGET_WIDTH;
  canvas.height = canvas.width * (img.height / img.width);

  let cur = {
    width: Math.floor(img.width * RESIZE_BY),
    height: Math.floor(img.height * RESIZE_BY),
  };

  oc.width = cur.width;
  oc.height = cur.height;
  octx.drawImage(img, 0, 0, cur.width, cur.height);
  while (cur.width * RESIZE_BY > TARGET_WIDTH) {
    cur = {
      width: Math.floor(cur.width * RESIZE_BY),
      height: Math.floor(cur.height * RESIZE_BY),
    };
    octx.drawImage(
      oc,
      0,
      0,
      cur.width * INVERSE,
      cur.height * INVERSE,
      0,
      0,
      cur.width,
      cur.height
    );
  }
  ctx.drawImage(
    oc,
    0,
    0,
    cur.width,
    cur.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  console.log("image resized, new size: ", cur);
  return { base64: canvas.toDataURL(), ...cur };
}

export function toDataURL(src: string, callback: (val: string | null) => void) {
  var img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = function () {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) {
      return callback(null);
    }
    var dataURL;
    canvas.height = img.naturalHeight;
    canvas.width = img.naturalWidth;
    ctx.drawImage(img, 0, 0);
    dataURL = canvas.toDataURL();
    callback(dataURL);
  };
  img.src = src;
  if (img.complete || img.complete === undefined) {
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    img.src = src;
  }
}

export function isBrowser() {
  return typeof window === "object";
}

export function imageUrl(id: string): string {
  return `/api/image/${id}`;
}
