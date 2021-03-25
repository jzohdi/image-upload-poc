import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const imageId = req.query.id;
  if (!imageId || Array.isArray(imageId)) {
    res.status(404).json({ error: "Invalid request." });
    return res.end();
  }
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) {
    res.status(404).json({ error: "Image not found." });
    return res.end();
  }
  const img = Buffer.from(
    image.base64.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });
  return res.end(img);
};
