import "./env";

const config = {
  accountSid: process.env.ACCOUNT_SID,
  authToken: process.env.AUTH_TOKEN,
  keySid: process.env.KEY_SID,
  secret: process.env.SECRET,
  outgoingApplicationSid: process.env.OUTGOIND_APPLICATION_SID,
};

export default config;
