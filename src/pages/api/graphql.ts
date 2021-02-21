import { ApolloServer } from "apollo-server-micro";
import { GraphQLDate } from "graphql-iso-date";
import {
  makeSchema,
  nonNull,
  nullable,
  objectType,
  stringArg,
  scalarType,
  list,
  booleanArg,
} from "nexus";
import path from "path";
import {
  createGallery,
  getGalleries,
  signIn,
  signUp,
  decodeJWT,
  deleteGallery,
  createImage,
  updateImage,
  deleteImage,
} from "../../lib/api/server";
import { prisma, Context } from "../../lib/prisma";

const DateScalar = scalarType({
  name: "Date",
  asNexusMethod: "date",
  description: "Date custom scalar type",
  parseValue(value) {
    console.log(value);
    return GraphQLDate.parseValue(value);
  },
  serialize(value) {
    return value;
    // return GraphQLDate.serialize(value);
  },
  parseLiteral(ast) {
    console.log(ast);
    return GraphQLDate.parseLiteral(ast, {});
  },
});
const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("email");
    t.nonNull.string("token");
    t.nonNull.string("expires");
    t.nonNull.string("refresh");
  },
});

const Image = objectType({
  name: "Image",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.date("createdAt");
    t.nonNull.boolean("disabled");
    t.nonNull.string("value");
    t.nonNull.string("galleryId");
  },
});

const Gallery = objectType({
  name: "Gallery",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.date("createdAt");
    t.nonNull.boolean("disabled");
    t.nonNull.string("value");
    t.nonNull.string("owner");
    t.list.field("images", {
      type: nonNull("Image"),
      resolve: (parent, _, ctx: Context) => {
        const token = ctx.req.headers.authorization;
        if (!parent.id) {
          return null;
        }
        let userId: string = "";
        try {
          userId = decodeJWT(token ?? "").id;
        } catch (e) {}
        return ctx.prisma.image.findMany({
          where: {
            AND: [
              {
                galleryId: parent.id,
              },
              {
                OR: [
                  {
                    disabled: false,
                  },
                  {
                    gallery: {
                      owner: userId,
                    },
                  },
                ],
              },
            ],
          },
        });
      },
    });
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
        resolve: (_, args, ctx: Context) => {
          return prisma.gallery.findUnique({
            where: { id: args.id },
          });
        },
      }),
      t.field("allGallery", {
        type: list("Gallery"),
        args: {},
        resolve: (_, args, ctx: Context) => {
          const token = ctx.req.headers.authorization;
          if (!token) {
            ctx.res.statusCode = 403;
            throw new Error("Unauthorized");
          }
          return getGalleries(token, ctx.prisma);
        },
      });
  },
});

function urlSafeBase64(str: string): string {
  if (str.length % 4 != 0) {
    str += "===".slice(0, 4 - (str.length % 4));
  }
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  return str;
}

const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.field("createImage", {
      type: "Image",
      args: {
        value: nonNull(stringArg()),
        galleryId: nonNull(stringArg()),
      },
      resolve: (_, args, ctx: Context) => {
        args.value = urlSafeBase64(args.value);
        return createImage(args, ctx.prisma);
      },
    }),
      t.field("updateImage", {
        type: "Boolean",
        args: {
          id: nonNull(stringArg()),
          value: nullable(stringArg()),
          disabled: nullable(booleanArg()),
        },
        resolve: (_, args, ctx: Context) => {
          const token = ctx.req.headers.authorization;
          if (!token) {
            ctx.res.statusCode = 403;
            throw new Error("Unauthorized");
          }
          const { id, ...rest } = args;
          return updateImage(id, rest, token, ctx.prisma);
        },
      }),
      t.field("deleteImage", {
        type: "Boolean",
        args: {
          id: nonNull(stringArg()),
        },
        resolve: (_, args, ctx: Context) => {
          const token = ctx.req.headers.authorization;
          if (!token) {
            ctx.res.statusCode = 403;
            throw new Error("Unauthorized");
          }
          return deleteImage(args.id, token, ctx.prisma);
        },
      }),
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
      t.field("deleteGallery", {
        type: "Boolean",
        args: {
          id: nonNull(stringArg()),
        },
        resolve: (_, args, ctx: Context) => {
          const token = ctx.req.headers.authorization;
          if (!token) {
            ctx.res.statusCode = 403;
            throw new Error("Unauthorized");
          }
          return deleteGallery(args.id, token, ctx.prisma);
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
