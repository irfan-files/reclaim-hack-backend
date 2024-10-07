import { NFTStorage, File } from "nft.storage";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const imageUrl = "https://placehold.co/600x400/EEE/31343C.jpg";
const apiKey = process.env.NFT_STORAGE_API_KEY;

if (!apiKey) {
  throw new Error(
    "NFT_STORAGE_API_KEY is not defined in environment variables."
  );
}

const client = new NFTStorage({ token: apiKey });

// Function to upload an image from a URL
async function uploadImageFromUrl(imageUrl: string) {
  try {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    const imageBlob = await response.blob(); // Convert response to Blob
    const imageFile = new File([imageBlob], "image.jpg", { type: "image/jpg" }); // Create a File object

    // Upload metadata to NFT.Storage
    const metadata = await client.store({
      name: "My NFT",
      description: "This NFT is created from an image URL.",
      image: imageFile,
    });

    console.log("Upload successful:", metadata);
    console.log("Image URL on NFT.Storage:", metadata);
  } catch (error: unknown) {
    console.error("Error uploading metadata:", error);
    if (error instanceof Error && "response" in error) {
      const responseError = error as {
        response: { data: any; status: number };
      };
      console.error("Response data:", responseError.response.data);
      console.error("Response status:", responseError.response.status);
    }
  }
}
// Example usage
uploadImageFromUrl(imageUrl);
