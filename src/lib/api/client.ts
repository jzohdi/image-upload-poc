import { request, gql, GraphQLClient } from "graphql-request";
import { NexusGenFieldTypes } from "../../pages/api/nexus-typegen";
import { useAuth } from "../../hooks/auth";

const USER_FIELDS = "id email token refresh";
const GALLERY_FIELDS = "id createdAt disabled value owner";
const IMAGE_FIELDS = "id value disabled galleryId";
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

function base64ToSafe(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/\=+$/, "");
}

export async function createImage(
  value: string,
  galleryId: string
): Promise<Image> {
  // https://stackoverflow.com/a/7139207/8709572
  const safeValue = base64ToSafe(value);
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
        ${IMAGE_FIELDS}
      }
    }
  }`;
  const client = getClient(jwt);
  const result = await client.request(query);
  const unpacked = unpack(result, "allGallery");
  return unpacked as Gallery[];
}

export async function updateImage(image: Partial<Image>): Promise<boolean> {
  if (!image.id) {
    throw new Error("key: id required");
  }
  const jwt = useAuth().getToken();
  if (!jwt) {
    throw new Error("Not loggen in.");
  }
  if (image.value) {
    image.value = base64ToSafe(image.value);
  }
  const query = gql`mutation {
    updateImage(${extractObject(image)})
  }`;
  const client = getClient(jwt);
  const response = await client.request(query);
  const unpacked = unpack(response, "updateImage");
  if (unpacked) {
    return true;
  }
  return false;
}

export async function deleteImage(id: string): Promise<boolean> {
  const jwt = useAuth().getToken();
  if (!jwt) {
    throw new Error("Not loggen in.");
  }
  const query = gql`mutation {
    deleteImage(id: "${id}") 
  }`;
  const client = getClient(jwt);
  const response = await client.request(query);
  const unpacked = unpack(response, "deleteImage");
  return unpacked as boolean;
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
  updateImage: boolean;
  deleteImage: boolean;
};
type UnpackType = keyof GraphQLResponse;

function unpack(data: GraphQLResponse | null, type: UnpackType) {
  if (!data) {
    return null;
  }
  return data[type];
}

function extractObject(obj: { [key: string]: any }): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      return `${key}: ${formatValue(value)}`;
    })
    .join(" ");
}

function formatValue(value: any): string {
  // check if int
  if (typeof value === "number") {
    return `${value}`;
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "boolean") {
    return `${value}`;
  }
  if (typeof value === "object") {
    return extractObject(value);
  }
  return "";
}
