# Image Upload POC

The goal is for a user to sign up, and be able to create a gallery where unauthed users can upload images to. All users will see images added to the gallery in real time.

## Stack V0:

- Typescript
- NextJS
- Auth -> Firebase (free for auth use)
- bootstrap-react

## Stack V1:

- Typescript
- NextJS
- GraphQL (Apollo)
- SQLite
- Prisma
- Auth -> Firebase (free for auth use)
- bootstrap-react

## Notes

In a first iteration (V0) of this POC I set up the implementation with pure Firestore. This worked out nicely for handling permissions and data, and would not cost money until scaling past the free tier.

### V0

#### Firestore permissions

This could be deveolped further with this nextjs [with-firebase-authentication](https://github.com/vercel/next.js/tree/canary/examples/with-firebase-authentication) example

The "galleries" collection can be described as following

```typescript
type Gallery = {
    createdAt: TimeStamp
    disabled: boolean
    images: {
        [id: string]: Image,
        ...
    }
    roles: {
        [uid: string]: "owner" | "editor"
    }
}

type Image = {
    id: string
    value: string // base64string
    createdAt: TimeStamp
}
```

The permissions in firestore are as follows:

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /galleries/{galleryId} {
      function isSignedIn() {
        return request.auth != null;
      }
			function getRole(src) {
      	return src.data.roles[request.auth.uid]
      }
      function isOneOfRoles(src, array) {
        return isSignedIn() && (getRole(src) in array)
      }
      function isEnabled(src) {
      	return src.data.disabled == false
      }
      // only an owner can update or delete
      // anyone can read the gallery
      // anyone signed in can create a gallery
      allow read;
      allow update, delete: if isOneOfRoles(resource, ["owner"]);
      allow create: if isSignedIn();

      match /images/{image} {
      	function isOwner() {
             return isOneOfRoles(get(/databases/$(database)/documents/galleries/$(galleryId)),
                                        ['owner'])
        }
        // anyone can read the images
        // anyone can create an image if the gallery is enabled
        // omly ownder can delete an image
      	allow read: if resource.data.disabled == false || isOwner();
        allow create: if isEnabled(get(/databases/$(database)/documents/galleries/$(galleryId)));
        allow update, delete: if isOwner();
      }
    }
  }
}
```
