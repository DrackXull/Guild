
'use server';

import { getSdks } from "@/firebase";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  collection
} from "firebase/firestore";

export function slugifyName(name: string) {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export function formatTagNumber(n: number) {
  if (isNaN(n) || n < 1) return '000';
  return n < 1000 ? n.toString().padStart(3, "0") : n.toString();
}

export function makePublicTag(name: string, n: number) {
  return `${slugifyName(name)}#${formatTagNumber(n)}`;
}

export async function createGuild({
  name,
  primaryGame,
  number,
  uid
}: {
  name: string;
  primaryGame: string;
  number: number;
  uid: string;
}) {
  const { firestore: db } = getSdks();
  const baseHandle = slugifyName(name);
  const tagNumber = number;
  const publicTag = makePublicTag(name, tagNumber);

  const dirRef = doc(db, "guildDirectory", publicTag);
  const guildRef = doc(collection(db, "guilds"));
  const memberRef = doc(db, "guildMembers", `${guildRef.id}_${uid}`);
  const playerRef = doc(db, "players", uid);

  await runTransaction(db, async (tx) => {
    const dirSnap = await tx.get(dirRef);
    if (dirSnap.exists()) {
      throw new Error("This guild tag is already taken");
    }

    const now = serverTimestamp();

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
      settings: {}
    });

    tx.set(dirRef, {
      guildId: guildRef.id,
      name,
      baseHandle,
      tagNumber,
      publicTag,
      primaryGame,
      visibility: "public",
      createdAt: now,
      updatedAt: now
    });

    tx.set(memberRef, {
      guildId: guildRef.id,
      uid,
      role: "leader",
      joinedAt: now,
      lastActiveAt: now
    });

    tx.set(playerRef, {
      guildId: guildRef.id,
      role: 'admin',
      rank: 'Elder',
      joinedAt: new Date().toISOString(),
    }, { merge: true });
  });

  return {
    guildId: guildRef.id,
    publicTag
  };
}

export async function findGuild(publicTag: string) {
  const { firestore: db } = getSdks();
  const docRef = doc(db, "guildDirectory", publicTag.toLowerCase().trim());
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}
