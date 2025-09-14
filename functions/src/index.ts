import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Property Investment Analyzer!");
});

export const processSuburbData = onRequest(async (request, response) => {
  try {
    // This function will process census and crime data for suburbs
    // Implementation will be added later
    response.json({
      success: true,
      message: "Suburb data processing endpoint ready"
    });
  } catch (error) {
    logger.error("Error processing suburb data:", error);
    response.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});