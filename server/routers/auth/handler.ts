import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { INCOMPLETE_DATA } from "../../errors";
import prisma from "../../prisma";
import { TypedRequest } from "../../types";
import {
  comparePassword,
  generateAccessToken,
  generateHashedPassword,
} from "./utils";

export const login = async (
  req: TypedRequest<
    Partial<{
      email: string;
      password: string;
    }>
  >,
  res: Response
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json(INCOMPLETE_DATA);
  }
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(400).json({
      message: "User not found",
    });
  }

  const isPasswordCorrect = await comparePassword(password, user.password);

  if (!isPasswordCorrect) {
    return res.status(400).json({
      message: "Password is Incorrect",
    });
  }

  // Generate Token
  const { password: _, ...safeUser } = user;
  const token = generateAccessToken({
    ...safeUser,
    validTime: 0,
  });
  return res.status(200).json({
    token,
    ...safeUser,
  });
};

export const signup = async (
  req: TypedRequest<
    Omit<Prisma.UserCreateInput, "company" | "settings"> & {
      companyId: number;
    }
  >,
  res: Response
) => {
  const { password } = req.body;
  const hashedPassword = await generateHashedPassword(password);

  const { companyId, ...prismaUserInput } = req.body;

  const prevUser = await prisma.user.findUnique({
    where: { email: prismaUserInput.email },
  });

  if (prevUser) {
    return res.json({
      message: "User with email already registered",
    });
  }

  const createdUser = await prisma.user.create({
    data: {
      ...prismaUserInput,
      password: hashedPassword,
      settings: {
        create: {},
      },
      company: {
        connectOrCreate: {
          where: {
            id: companyId,
          },
          create: {
            name: "Root",
          },
        },
      },
      roles: prismaUserInput.roles ?? ["ROLE_USER"],
    },
  });

  const { password: _, ...safeUser } = createdUser;
  return res.status(201).json(safeUser);
};
