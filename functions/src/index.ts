

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
import { slugifyName, formatTagNumber } from "./utils-server";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });


export const createGuild = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to create a guild.");
    }
    const uid = request.auth.uid;
    const { name, primaryGame, number } = request.data;

    if (!name || !primaryGame || !number) {
        throw new HttpsError("invalid-argument", "The function must be called with 'name', 'primaryGame', and 'number'.");
    }

    const baseHandle = slugifyName(name);
    const tagNumber = parseInt(number, 10);
    if (isNaN(tagNumber) || tagNumber < 1 || tagNumber > 9999) {
        throw new HttpsError("invalid-argument", "Tag number must be between 1 and 9999.");
    }
    const publicTag = `${baseHandle}#${formatTagNumber(tagNumber)}`;

    const dirRef = db.collection("guildDirectory").doc(publicTag);
    const guildRef = db.collection("guilds").doc();
    const membershipRef = db.collection("guildMembers").doc(`${guildRef.id}_${uid}`);
    const playerRef = db.collection("players").doc(uid);

    try {
        await db.runTransaction(async (tx) => {
            const dirSnap = await tx.get(dirRef);
            if (dirSnap.exists) {
                throw new HttpsError("already-exists", "This guild tag is already taken. Please try another number.");
            }

            const now = admin.firestore.FieldValue.serverTimestamp();

            // 1. Create the Guild document
            tx.set(guildRef, {
                name,
                baseHandle,
                tagNumber,
                publicTag,
                primaryGame,
                visibility: "public",
                createdAt: now,
                createdBy: uid,
                leaderUid: uid,
                inviteCode: null,
                settings: {},
            });

            // 2. Create the Guild Directory entry
            tx.set(dirRef, {
                guildId: guildRef.id,
                name,
                baseHandle,
                tagNumber,
                publicTag,
                primaryGame,
                visibility: "public",
                createdAt: now,
                updatedAt: now,
            });

            // 3. Create the leader's GuildMember document
            tx.set(membershipRef, {
                guildId: guildRef.id,
                uid,
                role: "leader",
                joinedAt: now,
                lastActiveAt: now,
            });

            // 4. Update the user's Player document with guildId and role
            tx.set(playerRef, {
              guildId: guildRef.id,
              role: 'admin', // Guild leader gets admin role
              rank: 'Elder',
              joinedAt: new Date().toISOString(),
            }, { merge: true });

        });

        logger.info(`Guild '${publicTag}' created successfully by user ${uid}. Guild ID: ${guildRef.id}`);
        return { success: true, guildId: guildRef.id, publicTag };

    } catch (error) {
        logger.error(`Error creating guild '${publicTag}' for user ${uid}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "An unexpected error occurred while creating the guild.");
    }
});

export const joinGuildByPublicTag = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to join a guild.");
    }

    const { publicTag } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token.email || 'Unknown';

    if (!publicTag) {
        throw new HttpsError("invalid-argument", "The function must be called with a 'publicTag'.");
    }

    const normalizedTag = publicTag.trim().toLowerCase();
    const guildDirRef = db.collection('guildDirectory').doc(normalizedTag);

    return db.runTransaction(async (transaction) => {
        const guildDirDoc = await transaction.get(guildDirRef);
        if (!guildDirDoc.exists) {
            throw new HttpsError("not-found", `The guild tag "${normalizedTag}" does not exist.`);
        }

        const { guildId } = guildDirDoc.data() as { guildId: string };
        const playerRef = db.collection('players').doc(uid);
        const playerDoc = await transaction.get(playerRef);

        if (playerDoc.exists && playerDoc.data()?.guildId) {
            throw new HttpsError("failed-precondition", "You are already in a guild and cannot join another.");
        }
        
        // This is a simplified application. In a real scenario, we'd use the full application form.
        const applicationRef = db.collection('applications').doc(uid);
        transaction.set(applicationRef, {
            userId: uid,
            guildId,
            applicantName: email.split('@')[0],
            inGameName: 'Not Set',
            discordTag: 'Not Set',
            status: 'pending',
            createdAt: new Date().toISOString(),
            // Fill in other required fields with defaults
            mainCharacters: "Not Set",
            mainClasses: [],
            hoursInGame: 0,
            favoriteModes: [],
            memorableExperience: "Joined via public tag.",
            availabilityDays: [],
            availabilityTimezone: "GMT-5",
            availabilityStart: "17:00",
            availabilityEnd: "22:00",
            guildExpectations: "Looking to join the community.",
        });

        // Update player doc to show they have a pending application
        transaction.set(playerRef, { hasPendingApplication: true }, { merge: true });

        return { success: true, message: "Application submitted successfully." };
    });
});


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
