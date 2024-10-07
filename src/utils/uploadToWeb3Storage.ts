import { Web3Storage, File } from "web3.storage";

const uploadToWeb3Storage = async (metadata: any) => {
  const client = new Web3Storage({ token: process.env.WEB3_STORAGE_API_KEY! });

  const buffer = Buffer.from(JSON.stringify(metadata));
  const files = [new File([buffer], "metadata.json")];

  const cid = await client.put(files);
  console.log("Stored files with cid:", cid);

  // Return the URL to access the stored metadata
  return `https://${cid}.ipfs.w3s.link/metadata.json`;
};

export default uploadToWeb3Storage;
