import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import { Reclaim } from "@reclaimprotocol/js-sdk";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { BaseSepoliaTestnet } from "@thirdweb-dev/chains";
import path from "path";
import fs from "fs";

dotenv.config();

const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "APP_ID",
  "APP_SECRET",
  "THIRDWEB_API_KEY",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const secretKey = process.env.THIRDWEB_API_KEY;

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

// Initialize the Thirdweb SDK for metadata uploads
const sdk = new ThirdwebSDK(BaseSepoliaTestnet, {
  secretKey: secretKey,
});

// Store refresh token securely (here it's just stored in memory for demo purposes)
let storedRefreshToken: string | null = null;

app.get("/", (_: Request, res: Response) => {
  res.send("HealthyFood NFT Backend is running");
});

// Step 1: Redirect user to Google OAuth for authentication
app.get("/auth", (req: Request, res: Response) => {
  const redirectUri = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    access_type: "offline", // This ensures we get a refresh token
    prompt: "consent", // Forces consent screen to ensure refresh token is provided
  });

  res.redirect(`${redirectUri}?${params.toString()}`);
});

// Step 2: OAuth callback - exchange authorization code for access/refresh tokens
app.get("/oauth2callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      console.error("No authorization code provided.");
      return res.status(400).send("No authorization code provided.");
    }

    console.log(`Received authorization code: ${code}`);

    // Exchange the code for tokens
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

    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token) {
      console.error("Failed to obtain access token.");
      return res.status(400).send("Failed to obtain access token.");
    }

    // Store refresh token for future use (you should store this in a database)
    storedRefreshToken = refresh_token || storedRefreshToken;

    // Fetch YouTube data using access token
    const youtubeResponse = await fetchYouTubeData(access_token);

    const channel = youtubeResponse.items[0];
    const channelId = channel.id;
    const channelTitle = channel.snippet.title;

    console.log(`Channel ID: ${channelId}`);
    console.log(`Channel Title: ${channelTitle}`);

    // Generate proof and validate
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

    const contextDataJson = proofData.claimInfo.context;
    const data = JSON.parse(contextDataJson);

    const imageMetadata = channel.snippet.thumbnails.high.url;
    const contextData = data.extractedParameters.channelId;
    const youtubeTitle = data.extractedParameters.title;

    // Metadata for NFT
    const metadata = {
      name: `YouTube Ownership NFT`,
      description: `Proof of Owner for YouTube account: ${youtubeTitle}`,
      image: `${imageMetadata}`,
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

    // Upload metadata using Thirdweb's SDK
    const storage = sdk.storage;
    const uri = await storage.upload(metadata);

    console.log("Token URI:", uri);

    return res.status(200).json({
      channelId: contextData,
      tokenURI: uri,
    });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("Axios Error in /oauth2callback:", error.message);
      return res.status(500).send("OAuth process failed. Please try again.");
    } else {
      console.error("General Error in /oauth2callback:", error.message);
      return res.status(500).send("Internal Server Error.");
    }
  }
});

// Step 3: Fetch metadata
app.get("/getmetadata", async (req: Request, res: Response) => {
  const metadataFilePath = path.join(__dirname, "metadata.json");
  const metadata = JSON.parse(fs.readFileSync(metadataFilePath, "utf-8"));
  return res.status(200).json({
    metadata,
  });
});

app.get("/tokenuri", async (req: Request, res: Response) => {
  const tokenURIFilePath = path.join(__dirname, "tokenURI.json");
  const tokenURI = JSON.parse(fs.readFileSync(tokenURIFilePath, "utf-8"));
  return res.status(200).json({
    tokenURI,
  });

// Helper function to fetch YouTube data
async function fetchYouTubeData(access_token: string) {
  try {
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
    return youtubeResponse.data;
  } catch (error: unknown) {
    // Handle expired access token using refresh token
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      storedRefreshToken
    ) {
      console.log("Access token expired, refreshing...");
      const newAccessToken = await refreshAccessToken(storedRefreshToken);
      return fetchYouTubeData(newAccessToken); // Retry with new access token
    } else {
      throw error;
    }
  }
}

// Helper function to refresh access token using refresh token
async function refreshAccessToken(refreshToken: string) {
  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      throw new Error("Failed to refresh access token.");
    }

    return access_token; // Return new access token
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw error;
  }
}

const PORT: number = parseInt(process.env.PORT!) || 8080;

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
