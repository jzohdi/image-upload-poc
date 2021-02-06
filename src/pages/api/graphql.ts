import { ApolloServer } from "apollo-server-micro";
import { GraphQLDate } from "graphql-iso-date";
import {
  makeSchema,
  nonNull,
  nullable,
  objectType,
  stringArg,
  scalarType,
} from "nexus";
import path from "path";
import prisma from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const tokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;
const refreshTokens: { [key: string]: string } = {};

const DateScalar = scalarType({
  name: "Date",
  asNexusMethod: "date",
  description: "Date custom scalar type",
  parseValue(value) {
    return GraphQLDate.parseValue(value);
  },
  serialize(value) {
    return GraphQLDate.serialize(value);
  },
  parseLiteral(ast) {
    return GraphQLDate.parseLiteral(ast, {});
  },
});
const User = objectType({
  name: "User",
  definition(t) {
    t.string("id");
    t.string("email");
    t.string("token");
    t.string("expires");
    t.string("refresh");
  },
});

const Image = objectType({
  name: "Image",
  definition(t) {
    t.string("id");
    t.date("createdAt");
    t.boolean("disabled");
    t.string("value");
  },
});

const Gallery = objectType({
  name: "Gallery",
  definition(t) {
    t.string("id");
    t.date("createdAt");
    t.boolean("disabled");
    t.string("value");
    t.string("owner");
    t.list.nullable.field("images", {
      type: "Image",
      resolve: (parent) =>
        prisma.image.findMany({ where: { galleryId: parent.id || undefined } }),
    });
  },
});

const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("gallery", {
      type: "Gallery",
      args: {
        id: nonNull(stringArg()),
      },
      resolve: (_, args) => {
        return prisma.gallery.findUnique({
          where: { id: args.id },
        });
      },
    });
  },
});

const SALT_ROUNDS = 10;

const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.field("createUser", {
      type: "User",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: (_, { email, password }, ctx) => {
        return new Promise((resolve, reject) => {
          bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
            if (err) {
              console.log("Error occured in createUser, ", err);
              reject();
            }
            prisma.user
              .create({
                data: { email, password: hash },
              })
              .then((user) => {
                const token = jwt.sign({ email }, tokenSecret, {
                  expiresIn: "3h",
                }); // 3 hours
                const refreshToken = jwt.sign({ email }, refreshSecret, {
                  expiresIn: "1 day",
                });
                refreshTokens[refreshToken] = email;
                resolve({
                  token,
                  expires: "10800s",
                  refresh: refreshToken,
                  ...user,
                });
              })
              .catch((err) => {
                console.log(err);
                reject("Error occured while creating user.");
              });
          });
        });
      },
    });
  },
});

export const schema = makeSchema({
  types: [Query, Mutation, User, Gallery, Image, DateScalar],
  outputs: {
    typegen: path.join(process.cwd(), "src/pages/api/nexus-typegen.ts"),
    schema: path.join(process.cwd(), "src/pages/api/schema.graphql"),
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default new ApolloServer({ schema }).createHandler({
  path: "/api/graphql",
});

function createUser(email: string, password: string) {}
