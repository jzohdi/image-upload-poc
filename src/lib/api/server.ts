import { Prisma } from "../prisma";
import { NexusGenFieldTypes } from "../../pages/api/nexus-typegen";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type Gallery = NexusGenFieldTypes["Gallery"];
type Image = NexusGenFieldTypes["Image"];

const tokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;
const refreshTokens: { [key: string]: string } = {};

type JWTEncoding = {
  id: string;
};

type SignInInfo = {
  email: string;
  password: string;
};

export async function signIn({ email, password }: SignInInfo, prisma: Prisma) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    return null;
  }
  const res = await bcrypt.compare(password, user.password);
  if (!res) {
    return null;
  }
  const endcoding: JWTEncoding = { id: user.id };
  const token = jwt.sign(endcoding, tokenSecret, {
    expiresIn: "3h",
  }); // 3 hours
  const refreshToken = jwt.sign(endcoding, refreshSecret, {
    expiresIn: "7 days",
  });
  return {
    token,
    expires: "10800s",
    refresh: refreshToken,
    ...user,
  };
}

type SignUpInfo = {
  email: string;
  password: string;
};

const SALT_ROUNDS = 10;

export async function signUp({ email, password }: SignUpInfo, prisma: Prisma) {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  if (!hashed) {
    return null;
  }
  const user = await prisma.user.create({
    data: { email, password: hashed },
  });
  const endcoding: JWTEncoding = { id: user.id };
  const token = jwt.sign(endcoding, tokenSecret, {
    expiresIn: "3h",
  }); // 3 hours
  const refreshToken = jwt.sign(endcoding, refreshSecret, {
    expiresIn: "7 days",
  });
  refreshTokens[refreshToken] = email;
  return {
    token,
    expires: "10800s",
    refresh: refreshToken,
    ...user,
  };
}
type CreateGalleryInput = {
  background: string;
  token: string;
};
export async function createGallery(
  { background, token }: CreateGalleryInput,
  prisma: Prisma
): Promise<Gallery> {
  const decoded = decodeJWT(token);
  const id = decoded.id;
  const newGallery = {
    createdAt: new Date().toISOString(),
    disabled: false,
    value: background,
    owner: id,
  };
  const createRes = await prisma.gallery.create({ data: newGallery });
  if (!createRes) {
    throw new Error("There was a problem creating the gallery.");
  }
  return createRes as Gallery;
}

export async function getGalleries(token: string, prisma: Prisma) {
  const decoded = decodeJWT(token);
  const query = await prisma.gallery.findMany({
    where: {
      owner: decoded.id,
    },
    include: {
      Image: true,
    },
  });
  if (!query) {
    throw new Error("There was a problem retrieving gallories.");
  }
  return query;
}

export async function deleteGallery(id: string, token: string, prisma: Prisma) {
  const decoded = decodeJWT(token);
  const gallery = await prisma.gallery.findUnique({
    where: {
      id,
    },
  });
  if (!gallery) {
    return false;
  }
  if (gallery && gallery.owner !== decoded.id) {
    throw new Error("Not authorized to delete this gallery.");
  }
  const deleteGallery = prisma.gallery.delete({
    where: {
      id,
    },
  });
  const deleteImages = prisma.image.deleteMany({
    where: {
      galleryId: id,
    },
  });
  await prisma.$transaction([deleteGallery, deleteImages]);
  return true;
}

type CreateImageInput = {
  value: string;
  galleryId: string;
};
export async function createImage(
  input: CreateImageInput,
  prisma: Prisma
): Promise<Image> {
  const { value, galleryId } = input;
  const resonse = await prisma.image.create({
    data: {
      galleryId,
      value,
    },
  });
  if (!resonse) {
    throw new Error("There was a problem creating image.");
  }
  return resonse;
}

function unpackToken(token: string) {
  return token.replace("Bearer ", "");
}

export function decodeJWT(token: string): JWTEncoding {
  const decoded = jwt.verify(unpackToken(token), tokenSecret);
  if (!decoded) {
    throw new Error("Could not verify token.");
  }
  return decoded as JWTEncoding;
}
