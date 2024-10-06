// src/index.ts

import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import { Reclaim } from "@reclaimprotocol/js-sdk";
import { NFTStorage } from "nft.storage";
import { ethers } from "ethers";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// Initialize ReclaimClient
const reclaimClient = new ReclaimClient(
  process.env.APP_ID!,
  process.env.APP_SECRET!
);

// Initialize NFTStorage
const nftStorageClient = new NFTStorage({
  token: process.env.NFT_STORAGE_API_KEY!,
});

// Read ABI from file
const abiPath = path.resolve(__dirname, "abi", "HealthyFood.json");
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

// Initialize Ethers.js Provider and Contract
const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL || "https://rinkeby.infura.io/v3/YOUR_INFURA_PROJECT_ID"
);
const contractAddress = process.env.CONTRACT_ADDRESS!;
const contract = new ethers.Contract(contractAddress, abi, provider);

// Health Check Route
app.get("/", (_: Request, res: Response) => {
  res.send("HealthyFood NFT Backend is running");
});

// OAuth2 Initiation Route
app.get("/auth", (req: Request, res: Response) => {
  const redirectUri = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    access_type: "offline",
    prompt: "consent",
  });

  res.redirect(`${redirectUri}?${params.toString()}`);
});

// OAuth2 Callback Route
app.get("/oauth2callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).send("No authorization code provided.");
    }

    // Exchange Authorization Code for Access Token
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(400).send("Failed to obtain access token.");
    }

    // Fetch YouTube Channel Information
    const youtubeResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,contentDetails,statistics",
          mine: true,
        },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (
      !youtubeResponse.data.items ||
      youtubeResponse.data.items.length === 0
    ) {
      return res.status(400).send("No YouTube channel found.");
    }

    const channel = youtubeResponse.data.items[0];
    const channelId: string = channel.id;
    const channelTitle: string = channel.snippet.title;

    // Generate Proof using Reclaim Protocol
    const proof = await reclaimClient.zkFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}`,
      {
        method: "GET",
      },
      {
        responseMatches: [
          {
            type: "regex",
            value: `"id":"${channelId}"`,
          },
          {
            type: "regex",
            value: `"title":"${channelTitle}"`,
          },
        ],
      }
    );

    if (!proof) {
      return res.status(400).send("Failed to generate proof.");
    }

    // Verify the Proof
    const isValid = await Reclaim.verifySignedProof(proof);
    if (!isValid) {
      return res.status(400).send("Proof is invalid.");
    }

    // Transform the Proof Data for On-chain Usage
    const proofData = await Reclaim.transformForOnchain(proof);

    // Create NFT Metadata
    const metadata = {
      name: `${channelTitle} YouTube Ownership NFT`,
      description: `Proof of ownership for YouTube account: ${channelTitle}`,
      image: "https://your-image-hosting-service.com/path-to-image.png", // Replace with your image URL or IPFS link
      attributes: [
        {
          trait_type: "YouTube Channel",
          value: channelTitle,
        },
        {
          trait_type: "Channel ID",
          value: channelId,
        },
        {
          trait_type: "Proof",
          value: JSON.stringify(proofData), // You can format this as needed
        },
      ],
    };

    // Convert metadata to a Blob
    const blob = new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    });

    // Upload Metadata to IPFS via nft.storage
    const ipfsCID = await nftStorageClient.storeBlob(blob);
    const tokenURI = `https://nftstorage.link/ipfs/${ipfsCID}`;

    // Respond with tokenURI
    res.status(200).json({
      channelId,
      channelTitle,
      tokenURI,
    });
  } catch (error: any) {
    console.error(
      "Error in /oauth2callback:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send("Internal Server Error.");
  }
});

// Example: Endpoint to Get Balance of an Address
app.get("/balance/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address;
    const balance = await contract.balanceOf(address);
    res.status(200).json({ balance: balance.toString() });
  } catch (error: any) {
    console.error("Error fetching balance:", error.message);
    res.status(500).send("Internal Server Error.");
  }
});

// Start Server
const PORT: number = parseInt(process.env.PORT!) || 8080;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
