export const INTERNAL_SERVER_ERROR = {
  err: "INTERNAL_SERVER_ERROR",
  message: "Server wasn't able to process the request. Try again later",
};

export const INCOMPLETE_DATA = {
  err: "BAD_REQUEST_DATA_MISSING",
  message: "Some fields are missing",
};

export const DUPLICATE_EMAIL = {
  err: "DUPLICATE_EMAIL",
  message: "Email Address is already taken",
};

export const USER_NOT_FOUND = {
  err: "USER_NOT_FOUND",
  message: "User with given email address doesn't exists",
};

export const UNAUTHORIZED = {
  err: "UNAUTHORIZED",
  message: "Authentication is required to access the resource",
};

export const TOKEN_ERROR = {
  err: "TOKEN_ERROR",
  message: "Server wasn't able to process your token. Please try again",
};
