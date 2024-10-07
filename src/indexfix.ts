// src/index.ts

import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import { Reclaim } from "@reclaimprotocol/js-sdk";
import uploadToNftStorage from "./utils/uploadToNftStorage";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

const reclaimClient = new ReclaimClient(
  process.env.APP_ID!,
  process.env.APP_SECRET!
);

const ABI_PATH = path.resolve(__dirname, "abi", "HealthyFood.json");
const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));

app.get("/", (_: Request, res: Response) => {
  res.send("HealthyFood NFT Backend is running");
});

// OAuth2 Authorization Endpoint
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

// OAuth2 Callback Endpoint
app.get("/oauth2callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).send("No authorization code provided.");
    }

    // Exchange authorization code for access token
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

    // Fetch the YouTube channel data
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

    console.log(`Channel ID: ${channelId}`);
    console.log(`Channel Title: ${channelTitle}`);

    // Generate a proof using zkFetch with the correct YouTube API endpoint
    const proof = await reclaimClient.zkFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}`,
      {
        method: "GET",
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        responseMatches: [
          {
            type: "regex",
            value:
              '"id":\\s*"(?<channelId>[^"]+)"[\\s\\S]*?"title":\\s*"(?<title>[^"]+)"',
          },
        ],
      }
    );

    console.log("Proof generated:", proof);

    if (!proof) {
      return res.status(400).send("Failed to generate proof.");
    }

    // Verify the proof
    const isValid = await Reclaim.verifySignedProof(proof);
    if (!isValid) {
      return res.status(400).send("Proof is invalid.");
    }

    console.log("Proof is valid.");

    // Transform proof data for on-chain usage
    const proofData = await Reclaim.transformForOnchain(proof);

    console.log("Proof Data for Onchain:", proofData);

    // Access the channel_id and channel_title from proofData
    const channel_id = proofData.signedClaim.claim.channel_id as string;
    const channel_title = proofData.signedClaim.claim.channel_title as string;

    // Create NFT metadata
    const metadata = {
      name: `${channel_title} YouTube Ownership NFT`,
      description: `Proof of ownership for YouTube account: ${channel_title}`,
      image: "https://your-image-hosting-service.com/path-to-image.png", // Replace with your image URL
      attributes: [
        {
          trait_type: "YouTube Channel",
          value: channel_title,
        },
        {
          trait_type: "Channel ID",
          value: channel_id,
        },
        {
          trait_type: "Proof",
          value: JSON.stringify(proofData),
        },
      ],
    };

    // Upload metadata to NFT storage
    const tokenURI = await uploadToNftStorage(metadata);

    console.log("Token URI:", tokenURI);

    // Respond with channel information and token URI
    return res.status(200).json({
      channelId: channel_id,
      channelTitle: channel_title,
      tokenURI,
    });
  } catch (error: any) {
    console.error(
      "Error in /oauth2callback:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).send("Internal Server Error.");
  }
});

// Start the server
const PORT: number = parseInt(process.env.PORT!) || 8080;

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
