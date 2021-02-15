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
import { createGallery, signIn, signUp } from "../../lib/api/server";
import { prisma, Context } from "../../lib/prisma";

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
  },
});

const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("signIn", {
      type: "User",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: (_, userInfo, ctx: Context) => {
        return signIn(userInfo, ctx.prisma);
      },
    }),
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

const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.field("createGallery", {
      type: "Gallery",
      args: {
        background: nonNull(stringArg()),
      },
      resolve: (_, args, ctx: Context) => {
        const token = ctx.req.headers.authorization;
        if (!token) {
          ctx.res.statusCode = 403;
          throw new Error("Unauthorized");
        }
        return createGallery(
          { background: args.background, token },
          ctx.prisma
        );
      },
    }),
      t.field("createUser", {
        type: "User",
        args: {
          email: nonNull(stringArg()),
          password: nonNull(stringArg()),
        },
        resolve: (_, args, ctx: Context) => signUp(args, ctx.prisma),
      });
  },
});

export const schema = makeSchema({
  types: [Query, Mutation, User, Gallery, Image, DateScalar],
  outputs: {
    typegen: path.join(process.cwd(), "src/pages/api/nexus-typegen.ts"),
    schema: path.join(process.cwd(), "src/pages/api/schema.graphql"),
  },
  contextType: {
    module: path.join(process.cwd(), "src/lib/prisma/index.ts"),
    export: "Context",
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};
const apollo = new ApolloServer({
  schema,
  context: ({ req, res }) => {
    return { prisma, req, res };
  },
});
export default apollo.createHandler({
  path: "/api/graphql",
});
