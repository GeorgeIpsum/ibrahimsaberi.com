// I use S3 to store these in production
// I dont want to include aws sdks. they suck
// so we're signing these requests manually
// https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html

const getDrop = async (dropPath?: string) => {
  return null;
};

export default getDrop;
