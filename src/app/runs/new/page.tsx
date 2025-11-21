import { RunReportForm } from "@/components/runs/run-report-form";
import { Swords } from "lucide-react";
import { allCharacters } from "@/lib/data";

export default function NewRunPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex items-center gap-4 mb-8">
        <Swords className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-wide">Submit a Run Report</h1>
          <p className="text-muted-foreground mt-1">Log your adventure. Your feedback strengthens the guild.</p>
        </div>
      </div>
      <RunReportForm allCharacters={allCharacters} />
    </div>
  );
}
