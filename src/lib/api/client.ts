import jwt from "jsonwebtoken";
import { request, gql } from "graphql-request";
import { NexusGenFieldTypes } from "../../pages/api/nexus-typegen";
import { useAuth } from "../../hooks/auth";

export type User = NexusGenFieldTypes["User"];
const USER_FIELDS = "id email token refresh";
const ENDPOINT = "/api/graphql";

export type Gallery = NexusGenFieldTypes["Gallery"];

/**
 * will fail if the user is not logged in
 * @param fileString bas64String of the file for the background of the session
 */
export async function createGalley(fileString: string): Promise<void> {
  const user = useAuth().getCurrentUser();
  if (!user) {
    throw new Error("Not logged in.");
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<User | null> {
  const query = gql`query {
        signIn(email: "${email}" password: "${password}") {
            ${USER_FIELDS}
        }
    }`;
  const result = await request(ENDPOINT, query);
  const unpacked = unpack(result, "signIn");
  return unpacked;
}

/**
 * This function is to be used at the root of the app,
 * Based on the localStorage tokens,
 * check if tokens exist and are valid and
 * log the user in, in the background
 */
const COLLAGE_APP_SESSIONS_TOKEN = "COLLAGE_APP_SESSIONS_TOKEN";
const COLLAGE_APP_REFRESH_TOKEN = "COLLAGE_APP_REFRESH_TOKEN";
export async function quietSignIn(): Promise<Partial<User>> {
  const token = localStorage.getItem(COLLAGE_APP_SESSIONS_TOKEN);
  const refresh = localStorage.getItem(COLLAGE_APP_REFRESH_TOKEN);
  if (!token || !refresh) {
    return {};
  }
  return {};
}

type UnpackTypes = "signIn";

type SignInResponse = {
  signIn: User;
};

type GraphQLResponse = SignInResponse | null;

function unpack(data: GraphQLResponse, type: UnpackTypes) {
  if (!data) {
    return null;
  }
  switch (type) {
    case "signIn":
      return data[type];
  }
}
