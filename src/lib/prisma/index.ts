import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export { default as prisma } from "./client";

export type Prisma = PrismaClient;

export type Context = {
  prisma: PrismaClient;
  req: NextApiRequest;
  res: NextApiResponse;
};
