import crypto from "node:crypto";

import env from "@/env.mjs";

// I use S3 to store these in production
// I dont want to include aws sdks. they suck
// so we're signing these requests manually
// https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html

const getDrop = async (dropPath?: string) => {
  const date = new Date().toISOString();
  const presign =
    "?X-Amz-Algorithm=AWS4-HMAC-SHA256" +
    encodeURIComponent(`${env.AWS_AK_ID}/`) +
    `&X-Amz-Date=${date}`;
  return fetch(env.BASIN_URL + "/" + dropPath);
};

export default getDrop;
