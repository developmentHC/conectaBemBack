import jwt from "jsonwebtoken";
import config from "../config/config.mjs";

const setAuthCookie = (res, userId) => {
  const accessToken = jwt.sign({ userId: userId }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  res.cookie("jwt", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 3600000,
    path: "/",
  });
};

export default setAuthCookie;
