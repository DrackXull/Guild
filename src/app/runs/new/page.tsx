
'use client';
import { RunReportForm } from "@/components/runs/run-report-form";
import { Swords, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, query } from "firebase/firestore";
import type { Character } from "@/lib/types";

export default function NewRunPage() {
  const firestore = useFirestore();

  const allCharactersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'characters'));
  }, [firestore]);

  const { data: allCharacters, isLoading: isLoadingAllCharacters } = useCollection<Character>(allCharactersQuery);

  if (isLoadingAllCharacters) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">Loading character data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex items-center gap-4 mb-8">
        <Swords className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-wide">Submit a Run Report</h1>
          <p className="text-muted-foreground mt-1">Log your adventure. Your feedback strengthens the guild.</p>
        </div>
      </div>
      <RunReportForm allCharacters={allCharacters || []} />
    </div>
  );
}
