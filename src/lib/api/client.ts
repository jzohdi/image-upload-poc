// returns an id
export async function uploadImage(base64: string): Promise<string> {
  const uploadResult = await post<{ id: string }>({ base64 });
  return uploadResult.id;
}

type Body = {
  [key: string]: any;
};
async function post<T>(body: Body): Promise<T> {
  const response = await fetch("/api/image", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const result = await response.json();
  return result;
}
