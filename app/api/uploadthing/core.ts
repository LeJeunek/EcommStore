import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";

const f = createUploadthing();
export const ourFileRouter = {
  imageUploader: f({
    image: {
      /**
      
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
    },
  })
    .middleware(async ({}) => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session?.user?.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;
export type OurFileRouter = typeof ourFileRouter;
