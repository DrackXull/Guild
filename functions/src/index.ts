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

export const tempDeleteUser = onCall(async (request) => {
  // This is a temporary and secure function for one-time admin use.
  // It checks that the caller is the intended user before proceeding.
  const callerUid = request.auth?.uid;
  const targetUid = request.data.uid;

  // IMPORTANT: Only allow this action if the person calling the function
  // is the same person they are trying to delete. This is a safeguard.
  // In a real scenario, you'd want even tighter security, but for this
  // specific recovery operation, this is sufficient.
  if (callerUid !== targetUid) {
    throw new HttpsError('permission-denied', 'You can only delete your own account.');
  }

  try {
    await admin.auth().deleteUser(targetUid);
    logger.info(`Successfully deleted user: ${targetUid}`);
    return { success: true, message: `User ${targetUid} deleted.` };
  } catch (error) {
    logger.error(`Error deleting user ${targetUid}:`, error);
    throw new HttpsError('internal', 'Failed to delete user.');
  }
});
