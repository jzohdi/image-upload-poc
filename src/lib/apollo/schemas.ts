import { gql } from "apollo-server-micro";

export const typeDefs = gql`
  type User {
    id: ID
    email: String
  }

  type Image {
    id: ID
    createdAt: String
    disabled: Boolean
    value: String
    galleryId: String
  }

  type Gallery {
    id: ID
    createdAt: String
    disabled: Boolean
    value: String
    owner: String
    images: [Image]
  }

  type Query {
    getUsers: [User]
    getUser(email: String!): User!
  }
  type Mutation {
    createUser(email: String, password: String): User
  }
`;
