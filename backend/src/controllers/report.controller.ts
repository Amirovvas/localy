import { NextFunction, Request, Response } from "express";
import {
  blockReportAuthorService,
  deleteReportedMessageService,
  deleteReportService,
  getReportContextService,
  listReportEventsService,
  listReportsService,
  reportMessageService,
  unblockReportAuthorService,
  updateReportStatusService,
} from "../services/report.service";

export const reportMessageController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.id;
    const report = await reportMessageService(Number(req.params.id), userId, req.body);
    res.status(201).json({ message: "report sent", data: report });
  } catch (error) {
    next(error);
  }
};

export const listReportsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const reports = await listReportsService(status);
    res.status(200).json({ message: "reports", data: reports });
  } catch (error) {
    next(error);
  }
};

export const getReportContextController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const context = await getReportContextService(Number(req.params.id));
    res.status(200).json({ message: "report context", data: context });
  } catch (error) {
    next(error);
  }
};

export const listReportEventsController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const events = await listReportEventsService(Number(req.params.id));
    res.status(200).json({ message: "report events", data: events });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatusController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = await updateReportStatusService(Number(req.params.id), req.body.status);
    res.status(200).json({ message: "report updated", data: report });
  } catch (error) {
    next(error);
  }
};

export const deleteReportController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteReportService(Number(req.params.id));
    res.status(200).json({ message: "report deleted" });
  } catch (error) {
    next(error);
  }
};

export const deleteReportedMessageController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = await deleteReportedMessageService(Number(req.params.id));
    res.status(200).json({ message: "message deleted", data: report });
  } catch (error) {
    next(error);
  }
};

export const blockReportAuthorController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = await blockReportAuthorService(Number(req.params.id));
    res.status(200).json({ message: "author blocked", data: report });
  } catch (error) {
    next(error);
  }
};

export const unblockReportAuthorController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = await unblockReportAuthorService(Number(req.params.id));
    res.status(200).json({ message: "author unblocked", data: report });
  } catch (error) {
    next(error);
  }
};
