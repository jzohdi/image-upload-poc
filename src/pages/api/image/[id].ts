import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getImage } from "../../../lib/api/server";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const imageId = req.query.id;
  if (!imageId || Array.isArray(imageId)) {
    res.status(404).json({ error: "Invalid request." });
    return res.end();
  }
  const image = await getImage(decodeURIComponent(imageId), prisma);
  if (!image) {
    res.status(404).json({ error: "Image not found." });
    return res.end();
  }

  const imageData = image.value.replace(/^data:image\/png;base64,/, "");
  res.end(imageData);
};
