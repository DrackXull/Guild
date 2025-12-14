
'use server';

import { getSdks } from "@/firebase";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { makePublicTag } from "./utils";

// This file is being deprecated in favor of Cloud Functions for guild management.
// The createGuild logic is now in `functions/src/index.ts`.
// The findGuild functionality will be used by the join function.

export async function findGuild(publicTag: string) {
  const { firestore: db } = getSdks();
  const docRef = doc(db, "guildDirectory", publicTag.toLowerCase().trim());
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}
