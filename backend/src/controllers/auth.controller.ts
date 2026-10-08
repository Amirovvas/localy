import { NextFunction, Request, Response } from "express";
import {
  loginService,
  logoutService,
  profileService,
  refreshService,
  registerService,
  updateProfileService,
} from "../services/auth.service";

const isProd = process.env.NODE_ENV === "production";
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  secure: isProd,
};

export const registerController = async (
  req: Request<
    {},
    {},
    {
      name: string;
      email: string;
      password: string;
      city: string;
      communityIds: number[];
    }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await registerService(req.body);
    res.status(201).json({
      message: "registered successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request<{}, {}, { email: string; password: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user, tokens } = await loginService(req.body);
    res.cookie("refreshToken", tokens.refreshToken, refreshCookieOptions);
    res.status(200).json({
      message: "logged in",
      user,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    const result = await refreshService(token);
    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
    res.status(200).json({
      message: "refreshed",
      token: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const profileController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const result = await profileService(userId);
    res.status(200).json({
      message: "profile",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const result = await updateProfileService(userId, req.body);
    res.status(200).json({
      message: "profile updated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    await logoutService(token);
    res.clearCookie("refreshToken", refreshCookieOptions);
    res.status(200).json({
      message: "logged out",
    });
  } catch (error) {
    next(error);
  }
};
