import { request, gql, GraphQLClient } from "graphql-request";
import { NexusGenFieldTypes } from "../../pages/api/nexus-typegen";
import { useAuth } from "../../hooks/auth";

const USER_FIELDS = "id email token refresh";
const GALLERY_FIELDS = "id createdAt disabled value owner";
const IMAGE_FIELDS = "id value disabled";
const ENDPOINT = "/api/graphql";

let client: GraphQLClient;

export function getClient(token: string | null): GraphQLClient {
  if (!client) {
    client = new GraphQLClient(ENDPOINT);
  }
  if (token) {
    client.setHeader("authorization", `Bearer ${token}`);
  } else {
    client.setHeader("authorization", "");
  }
  return client;
}

export type User = NexusGenFieldTypes["User"];
export type Image = NexusGenFieldTypes["Image"];
export type Gallery = NexusGenFieldTypes["Gallery"];

export async function createImage(
  value: string,
  galleryId: string
): Promise<Image> {
  // https://stackoverflow.com/a/7139207/8709572
  const safeValue = value
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/\=+$/, "");
  const query = gql`
    mutation AddImage($value: String!, $galleryId: String!) {
      createImage(value: $value, galleryId: $galleryId) {
        id
        disabled
      }
    }
  `;
  const client = getClient(null);
  const response = await client.request(query, { value: safeValue, galleryId });
  const unpacked = unpack(response, "createImage");
  return unpacked as Image;
}
/**
 * will fail if the user is not logged in
 * @param fileString bas64String of the file for the background of the session
 */
export async function createGalley(
  fileString: string
): Promise<Gallery | null> {
  const token = useAuth().getToken();
  if (!token) {
    throw new Error("Not logged in.");
  }
  const query = gql`mutation  {
    createGallery(background: "${fileString}") {
      ${GALLERY_FIELDS}
    }
  }`;
  const client = getClient(token);
  const result = await client.request(query);
  const unpacked = unpack(result, "createGallery");
  if (!unpacked) {
    throw new Error("There was problem unpacking createGallery resonse");
  }
  return unpacked as Gallery;
}

export async function getGallery(
  id: string,
  token: string | null
): Promise<Gallery> {
  // dont need to be logged in
  // const jwt = useAuth().getToken();
  // if (!jwt) {
  //   throw new Error("Not logged in");
  // }
  const query = gql`query {
    gallery(id: "${id}") {
      ${GALLERY_FIELDS}
      images {
        ${IMAGE_FIELDS}
      }
    }
  }
  `;
  const client = getClient(token);
  const result = await client.request(query);
  const unpacked = unpack(result, "gallery");
  return unpacked as Gallery;
}

export async function getGalleries(): Promise<Gallery[] | null> {
  const jwt = useAuth().getToken();
  if (!jwt) {
    throw new Error("Not loggen in.");
  }
  const query = gql`query {
    allGallery {
      ${GALLERY_FIELDS}
      images {
        value
      }
    }
  }`;
  const client = getClient(jwt);
  const result = await client.request(query);
  const unpacked = unpack(result, "allGallery");
  return unpacked as Gallery[];
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
  if (!unpacked) {
    throw new Error("There was an error unpacking signIn response.");
  }
  return unpacked as User;
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

type GraphQLResponse = {
  createGallery: Gallery;
  signIn: User;
  allGallery: Gallery[];
  gallery: Gallery;
  createImage: Image;
};
type UnpackType = keyof GraphQLResponse;

function unpack(data: GraphQLResponse | null, type: UnpackType) {
  if (!data) {
    return null;
  }
  return data[type];
}
