
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });


export const awardBountyHonor = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to complete a bounty.");
  }

  const { bountyId } = request.data;
  const callerUid = request.auth.uid;

  if (!bountyId) {
    throw new HttpsError("invalid-argument", "The function must be called with a 'bountyId'.");
  }

  const bountyRef = db.collection("member_bounties").doc(bountyId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const bountyDoc = await transaction.get(bountyRef);

      if (!bountyDoc.exists) {
        throw new HttpsError("not-found", "Bounty does not exist.");
      }

      const bounty = bountyDoc.data();
      if (!bounty) {
        throw new HttpsError("internal", "Failed to read bounty data.");
      }


      if (bounty.requestingPlayerId !== callerUid) {
        throw new HttpsError("permission-denied", "Only the bounty creator can mark it as complete.");
      }

      if (bounty.status !== "in_progress") {
        throw new HttpsError("failed-precondition", `Bounty is not in progress. Current status: ${bounty.status}`);
      }

      if (!bounty.acceptedPlayerId) {
        throw new HttpsError("failed-precondition", "Bounty has no accepted player.");
      }

      // Get references to both players
      const requestingPlayerRef = db.collection("players").doc(bounty.requestingPlayerId);
      const acceptedPlayerRef = db.collection("players").doc(bounty.acceptedPlayerId);
      
      const [requestingPlayerDoc, acceptedPlayerDoc] = await transaction.getAll(requestingPlayerRef, acceptedPlayerRef);

      if (!requestingPlayerDoc.exists) {
          throw new HttpsError("internal", "Bounty creator's player record not found.");
      }
      if (!acceptedPlayerDoc.exists) {
          throw new HttpsError("internal", "Bounty completer's player record not found.");
      }

      const acceptedPlayerData = acceptedPlayerDoc.data();
      if (!acceptedPlayerData) {
           throw new HttpsError("internal", "Could not read bounty completer's data.");
      }

      // Update the bounty status
      transaction.update(bountyRef, {
        status: "complete",
        completedAt: new Date().toISOString(),
      });

      // Award honor to the accepted player
      const newHonor = (acceptedPlayerData.currentHonor || 0) + bounty.reward;
      const newLifetimeHonor = (acceptedPlayerData.lifetimeHonor || 0) + bounty.reward;
      
      transaction.update(acceptedPlayerRef, {
          currentHonor: newHonor,
          lifetimeHonor: newLifetimeHonor,
          maxHonor: Math.max(acceptedPlayerData.maxHonor || 0, newHonor),
      });

      return { success: true, message: "Bounty completed and honor awarded." };
    });

    logger.info(`Bounty ${bountyId} completed successfully by ${callerUid}.`);
    return result;

  } catch (error) {
    logger.error(`Error completing bounty ${bountyId}:`, error);
    if (error instanceof HttpsError) {
        throw error;
    }
    throw new HttpsError("internal", "An unexpected error occurred while completing the bounty.");
  }
});
