import { NextFunction, Request, Response } from "express";
import {
  createCommunityService,
  discoverCommunitiesService,
  joinCommunityService,
  leaveCommunityService,
  deleteCommunityService,
  getCommunityService,
  getPublicStatsService,
  listAdminCommunitiesService,
  listCommunitiesService,
  listMyCommunitiesService,
  updateCommunityService,
} from "../services/community.service";

export const getPublicStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await getPublicStatsService();
    res.status(200).json({ message: "stats", data: stats });
  } catch (error) {
    next(error);
  }
};

export const getCommunitiesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const communities = await listCommunitiesService();
    res.status(200).json({ message: "communities", data: communities });
  } catch (error) {
    next(error);
  }
};

export const listAdminCommunitiesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const communities = await listAdminCommunitiesService();
    res.status(200).json({ message: "admin communities", data: communities });
  } catch (error) {
    next(error);
  }
};

export const getMyCommunitiesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const communities = await listMyCommunitiesService(userId);
    res.status(200).json({ message: "my communities", data: communities });
  } catch (error) {
    next(error);
  }
};

export const getCommunityController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const community = await getCommunityService(Number(req.params.id), userId);
    res.status(200).json({ message: "community", data: community });
  } catch (error) {
    next(error);
  }
};

export const createCommunityController = async (
  req: Request<{}, {}, { name: string; category: string; city: string; description?: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const community = await createCommunityService(req.body);
    res.status(201).json({ message: "community created", data: community });
  } catch (error) {
    next(error);
  }
};

export const updateCommunityController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const community = await updateCommunityService(Number(req.params.id), req.body);
    res.status(200).json({ message: "community updated", data: community });
  } catch (error) {
    next(error);
  }
};

export const deleteCommunityController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteCommunityService(Number(req.params.id));
    res.status(200).json({ message: "community deleted" });
  } catch (error) {
    next(error);
  }
};

export const discoverCommunitiesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;

    const communities = await discoverCommunitiesService(userId, search || undefined, category);
    res.status(200).json({ message: "communities to join", data: communities });
  } catch (error) {
    next(error);
  }
};

export const joinCommunityController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const community = await joinCommunityService(Number(req.params.id), userId);
    res.status(200).json({ message: "joined community", data: community });
  } catch (error) {
    next(error);
  }
};

export const leaveCommunityController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    await leaveCommunityService(Number(req.params.id), userId);
    res.status(200).json({ message: "left community" });
  } catch (error) {
    next(error);
  }
};
