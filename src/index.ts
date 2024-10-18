import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import { Reclaim } from "@reclaimprotocol/js-sdk";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { BaseSepoliaTestnet } from "@thirdweb-dev/chains";
import { OAuth2Client } from "google-auth-library";

dotenv.config();
// const path = require('path');
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
    origin: process.env.REDIRECT_FRONT_END_URL,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

const reclaimClient = new ReclaimClient(
  process.env.APP_ID!,
  process.env.APP_SECRET!
);
const sdk = new ThirdwebSDK(BaseSepoliaTestnet, { secretKey });

// Store refresh token securely
let storedRefreshToken: string | null = null;

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

app.get("/", (_: Request, res: Response) => {
  res.send("Youtube Proof Ownership NFT Backend is running");
});

app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Step 1: Redirect user to Google OAuth for authentication
app.get("/auth", (req: Request, res: Response) => {
  const redirectUri = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.readonly"],
    prompt: "consent",
  });
  res.redirect(redirectUri);
});

// Step 2: OAuth callback - exchange authorization code for access/refresh tokens
app.get("/oauth2callback", async (req: Request, res: Response) => {
  const { code } = req.query;

  try {
    if (!code || typeof code !== "string") {
      console.error("No authorization code provided.");
      return res.status(400).send("No authorization code provided.");
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch YouTube channel data
    const youtubeData = await fetchYouTubeData(tokens.access_token!);
    const channel = youtubeData.items[0];
    const channelId = channel.id;
    const channelTitle = channel.snippet.title;

    // Fetch Youtube data for nft description
    const channelSubscriber = channel.statistics.subscriberCount;
    const channelViewCount = channel.statistics.viewCount;
    const channelTotalVideo = channel.statistics.videoCount;
    const channelPublisedAt = channel.snippet.publishedAt;

    // Generate proof using Reclaim protocol
    const proof = await reclaimClient.zkFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}`,
      {
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        responseMatches: [
          {
            type: "regex",
            value:
              '"id":\\s*"(?<channelId>[^"]+)"[\\s\\S]*?"title":\\s*"(?<title>[^"]+)"',
          },
        ],
      }
    );

    // Handle proof generation failure
    if (!proof) {
      console.error("Failed to generate proof.");
      return res.status(400).send("Failed to generate proof.");
    }

    // Verify proof
    const isValid = await Reclaim.verifySignedProof(proof);
    if (!isValid) {
      console.error("Proof is invalid.");
      return res.status(400).send("Proof is invalid.");
    }

    // Transform proof for on-chain purposes
    const proofData = await Reclaim.transformForOnchain(proof);
    const imageURL = `https://www.youtubeapizkfetch.xyz/images/images.png`;
    
    // Information for nft attribute
    const proofIdentifier = proofData.signedClaim.claim.identifier;
    
    const metadata = {
      name: `YouTube Ownership NFT`,
      description: `Proof of Owner for YouTube account`,
      image: imageURL,
      attributes: [
        { trait_type: "Proof", value: proofIdentifier },
      ],
    };

    // Upload metadata using Thirdweb SDK
    const storage = sdk.storage;
    const uri = await storage.upload(metadata);
    const url = `${process.env.REDIRECT_FRONT_END_URL}/oauth2callback/?access_token=${tokens.access_token}&channel_id=${channelId}&token_uri=${uri}&channel_title=${channelTitle}&identifier=${proofIdentifier}&image_url=${imageURL}&channel_subscriber=${channelSubscriber}&channel_total_video=${channelTotalVideo}&channel_view_count=${channelViewCount}&channel_published_at=${channelPublisedAt}&proofData=${encodeURIComponent(JSON.stringify(proofData))}`
    res.redirect(
          url
        );
  } catch (error) {
    console.error("Error in /oauth2callback:", error);
    res.status(500).send("Error during authentication process.");
  }
});

// Helper function to fetch YouTube data
async function fetchYouTubeData(access_token: string) {
  const youtubeResponse = await axios.get(
    "https://www.googleapis.com/youtube/v3/channels",
    {
      params: { part: "snippet,contentDetails,statistics", mine: true },
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );
  return youtubeResponse.data;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
