import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Endpoint only supports POST" });
    return res.end();
  }
  const image = req.body.base64;
  if (!image) {
    res.status(418).json({
      error: "The server refuses the attempt to brew coffee with a teapot.",
    });
    return res.end();
  }
  const addImageToDb = await prisma.image.create({ data: { base64: image } });

  if (!addImageToDb) {
    res.status(404).json({ error: "There was a problem persisting image" });
    return res.end();
  }
  res.status(200).json({ id: addImageToDb.id });
  return res.end();
};
