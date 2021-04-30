export const INTERNAL_SERVER_ERROR = {
  err: "INTERNAL_SERVER_ERROR",
  message: "Server wasn't able to process the request. Try again later",
} as const;

export const INCOMPLETE_DATA = {
  err: "BAD_REQUEST_DATA_MISSING",
  message: "Some fields are missing",
} as const;

export const DUPLICATE_EMAIL = {
  err: "DUPLICATE_EMAIL",
  message: "Email Address is already taken",
} as const;

export const USER_NOT_FOUND = {
  err: "USER_NOT_FOUND",
  message: "User with given email address doesn't exists",
} as const;

export const UNAUTHORIZED = {
  err: "UNAUTHORIZED",
  message: "Authentication is required to access the resource",
} as const;

export const TOKEN_ERROR = {
  err: "TOKEN_ERROR",
  message: "Server wasn't able to process your token. Please try again",
} as const;

export const FORBIDDEN = {
  err: "FORBIDDEN",
  message: "You don't have permission to access this resource",
} as const;

export const DATA_INCORRECT = {
  err: "DATA_INCORRECT",
  message: "Data supplied to resource is incorrect. Please check and try again",
} as const;
