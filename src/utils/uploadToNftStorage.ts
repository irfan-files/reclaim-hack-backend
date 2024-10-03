import { NFTStorage, File } from "nft.storage";

const uploadToNftStorage = async (metadata: object): Promise<string> => {
  const nftStorage = new NFTStorage({
    token: process.env.NFT_STORAGE_API_KEY!,
  });

  // Convert metadata object to a Blob
  const blob = new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  });

  // Create a File from the Blob
  const file = new File([blob], "metadata.json");

  // Store the metadata on IPFS
  const cid = await nftStorage.storeBlob(blob);

  // Alternatively, you can use `store` to include files like images
  // const metadataCID = await nftStorage.store(metadata);

  return `https://nftstorage.link/ipfs/${cid}`;
};

export default uploadToNftStorage;
