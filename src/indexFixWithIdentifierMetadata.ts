// src/index.ts

import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import { Reclaim } from "@reclaimprotocol/js-sdk";
import uploadToWeb3Storage from "./utils/uploadToWeb3Storage";
import path from "path";
import fs from "fs";
import { SignedClaim, ProofData } from "./types";

dotenv.config();

const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "APP_ID",
  "APP_SECRET",
  "WEB3_STORAGE_API_KEY",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
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

app.get("/oauth2callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      console.error("No authorization code provided.");
      return res.status(400).send("No authorization code provided.");
    }

    console.log(`Received authorization code: ${code}`);

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

    console.log("Token response received:", tokenResponse.data);

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      console.error("Failed to obtain access token.");
      return res.status(400).send("Failed to obtain access token.");
    }

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

    console.log(
      "YouTube API response:",
      JSON.stringify(youtubeResponse.data, null, 2)
    );

    if (
      !youtubeResponse.data.items ||
      youtubeResponse.data.items.length === 0
    ) {
      console.error("No YouTube channel found.");
      return res.status(400).send("No YouTube channel found.");
    }

    const channel = youtubeResponse.data.items[0];
    const channelId: string = channel.id;
    const channelTitle: string = channel.snippet.title;

    console.log(`Channel ID: ${channelId}`);
    console.log(`Channel Title: ${channelTitle}`);

    const proof = await reclaimClient.zkFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}`,
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
      console.error("Failed to generate proof.");
      return res.status(400).send("Failed to generate proof.");
    }

    const isValid = await Reclaim.verifySignedProof(proof);
    if (!isValid) {
      console.error("Proof is invalid.");
      return res.status(400).send("Proof is invalid.");
    }

    console.log("Proof is valid.");

    const proofData = await Reclaim.transformForOnchain(proof);

    const proofdataIdentifier = proofData.signedClaim.claim.identifier;
    console.log(`cok posisi`, proofdataIdentifier);

    const contextDataJson = proofData.claimInfo.context;
    const data = JSON.parse(contextDataJson); // isi data channel , tittle , provider has

    const imageMetadata = await youtubeResponse.data.items[0].snippet.thumbnails
      .high.url;
    const contextData = data.extractedParameters.channelId;
    const youtubeTitle = data.extractedParameters.title;

    console.log("gambarnya su", imageMetadata);
    console.log(`Extracted Proof Data - Channel ID: ${contextData}`);

    const metadata = {
      name: ` YouTube Ownership NFT`,
      description: `Proof of Owner for YouTube account: ${youtubeTitle}`,
      image: `${imageMetadata}`, // Replace with your image URL
      attributes: [
        {
          trait_type: "Channel Name",
          value: youtubeTitle,
        },
        {
          trait_type: "Channel Data ID",
          value: contextData,
        },
        {
          trait_type: "Channel Data Image",
          value: imageMetadata,
        },
        {
          trait_type: "Proof",
          value: proofdataIdentifier,
        },
      ],
    };

    const fs = require("fs");
    const path = require("path");

    const metadataFilePath = path.join(__dirname, "metadata.json");
    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));

    console.log(`Metadata written to ${metadataFilePath}`);

    console.log("NFT Metadata:", metadata);

    const tokenURI = await uploadToWeb3Storage(metadata);

    console.log("Token URI:", tokenURI);

    return res.status(200).json({
      channelId: contextData,
      tokenURI,
    });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(
          "Axios Error in /oauth2callback:",
          "Status:",
          error.response.status,
          "Data:",
          error.response.data
        );
      } else if (error.request) {
        console.error(
          "Axios Error in /oauth2callback: No response received:",
          error.request
        );
      } else {
        console.error("Axios Error in /oauth2callback:", error.message);
      }
      return res.status(500).send("OAuth process failed. Please try again.");
    } else {
      console.error("General Error in /oauth2callback:", error.message);
      return res.status(500).send("Internal Server Error.");
    }
  }
});

app.get("/getmetadata", async (req: Request, res: Response) => {
  const metadataFilePath = path.join(__dirname, "metadata.json");
  const metadata = JSON.parse(fs.readFileSync(metadataFilePath, "utf-8"));
  return res.status(200).json({
    metadata,
  });
});

const PORT: number = parseInt(process.env.PORT!) || 8080;

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
