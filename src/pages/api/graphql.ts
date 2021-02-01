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
  },
});

const Image = objectType({
  name: "Image",
  definition(t) {
    t.string("id");
    t.field("createdAt", { type: "Date" });
    t.boolean("disabled");
    t.string("value");
  },
});

const Gallery = objectType({
  name: "Gallery",
  definition(t) {
    t.string("id");
    t.field("createdAt", { type: "Date" });
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
        console.log({ password, email });
        return {};
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
