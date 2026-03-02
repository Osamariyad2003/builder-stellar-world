import { Request, Response } from "express";
import { saveFCMToken, sendNotificationToBatch, sendNotificationToUsers } from "./fcmService";

export async function handleSaveFCMToken(req: Request, res: Response) {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: "Missing userId or token",
      });
    }

    const result = await saveFCMToken(userId, token);
    return res.json(result);
  } catch (error) {
    console.error("Error in handleSaveFCMToken:", error);
    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}

export async function handleSendBatchNotification(req: Request, res: Response) {
  try {
    const { batchId, notification, data } = req.body;

    if (!batchId || !notification || !notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: batchId, notification.title, notification.body",
      });
    }

    const result = await sendNotificationToBatch(batchId, notification, data);
    return res.json(result);
  } catch (error) {
    console.error("Error in handleSendBatchNotification:", error);
    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}

export async function handleSendUserNotification(req: Request, res: Response) {
  try {
    const { userIds, notification, data } = req.body;

    if (!Array.isArray(userIds) || !notification || !notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userIds (array), notification.title, notification.body",
      });
    }

    const result = await sendNotificationToUsers(userIds, notification, data);
    return res.json(result);
  } catch (error) {
    console.error("Error in handleSendUserNotification:", error);
    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}
