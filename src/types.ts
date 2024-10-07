// src/types.ts

export interface SignedClaim {
  claim: {
    channel_id: string;
    title: string;
    etag: string;
    subscriberCount: number;
    viewCount: number;
    // Add other claim properties if necessary
  };
  signatures: string[];
}

export interface ProofData {
  claimInfo: { [key: string]: string };
  signedClaim: SignedClaim;
}
