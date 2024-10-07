// import { NFTStorage, File } from "nft.storage";

// const uploadToNftStorage = async (metadata: object): Promise<string> => {
//   const nftStorage = new NFTStorage({
//     token: process.env.NFT_STORAGE_API_KEY!,
//   });

//   const blob = new Blob([JSON.stringify(metadata)], {
//     type: "application/json",
//   });

//   const file = new File([blob], "metadata.json");

//   const cid = await nftStorage.storeBlob(blob);

//   return `https://nftstorage.link/ipfs/${cid}`;
// };

// export default uploadToNftStorage;

// src/utils/uploadToNftStorage.ts

// src/utils/uploadToNftStorage.ts

// src/utils/uploadToNftStorage.ts

// src/utils/uploadToNftStorage.ts

import { NFTStorage, File } from "nft.storage";

const uploadToNftStorage = async (metadata: object): Promise<string> => {
  const apiKey = process.env.NFT_STORAGE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NFT_STORAGE_API_KEY is not defined in environment variables."
    );
  }

  const client = new NFTStorage({ token: apiKey });

  const blob = new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  });
  const file = new File([blob], "metadata.json");

  try {
    const metadataCid = await client.storeDirectory([file]);
    const tokenURI = `https://ipfs.io/ipfs/${metadataCid}/metadata.json`;

    return tokenURI;
  } catch (error) {
    console.error("Error uploading metadata to NFT.Storage:", error);
    throw new Error("Failed to upload metadata to NFT storage.");
  }
};

export default uploadToNftStorage;
