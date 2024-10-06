import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import { Reclaim } from "@reclaimprotocol/js-sdk";
import uploadToNftStorage from "./utils/uploadToNftStorage";
import path from "path";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const reclaimClient = new ReclaimClient(
  process.env.APP_ID!,
  process.env.APP_SECRET!
);

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

app.get("/oauth2callback", (async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).send("No authorization code provided.");
    }

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

    const isValid = await Reclaim.verifySignedProof(proof);
    if (!isValid) {
      return res.status(400).send("Proof is invalid.");
    }

    const proofData = await Reclaim.transformForOnchain(proof);

    const metadata = {
      name: `${channelTitle} YouTube Ownership NFT`,
      description: `Proof of ownership for YouTube account: ${channelTitle}`,
      image: "https://your-image-hosting-service.com/path-to-image.png",
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
          value: JSON.stringify(proofData),
        },
      ],
    };

    const tokenURI = await uploadToNftStorage(metadata);

    return res.status(200).json({
      channelId,
      channelTitle,
      tokenURI,
    });
  } catch (error: any) {
    console.error(
      "Error in /oauth2callback:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).send("Internal Server Error.");
  }
}) as express.RequestHandler);

const PORT: number = parseInt(process.env.PORT!) || 8080;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
