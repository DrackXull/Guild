import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function OfficerPage() {
  return (
    <div className="officer-theme space-y-8">
      <div className="flex items-center gap-4">
        <Shield className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-wide">Officer Lounge</h1>
          <p className="text-muted-foreground mt-1">Manage guild settings, rules, and bounties from the command center.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Drastic Score Rules</CardTitle>
          <CardDescription>
            Set character count requirements for run report notes to discourage trolling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="low-score-chars">Low Score Comment Length (Score ≤ 3)</Label>
              <Input id="low-score-chars" type="number" defaultValue="140" />
              <p className="text-sm text-muted-foreground">Minimum characters required for very low ratings.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="high-score-chars">High Score Comment Length (Score ≥ 9)</Label>
              <Input id="high-score-chars" type="number" defaultValue="80" />
               <p className="text-sm text-muted-foreground">Minimum characters required for very high ratings.</p>
            </div>
          </div>
          <Button>Save Drastic Score Rules</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Verified Run System</CardTitle>
          <CardDescription>
            Configure honor point awards and verification requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min-reporters">Minimum Reporters for Verification</Label>
              <Input id="min-reporters" type="number" defaultValue="2" />
              <p className="text-sm text-muted-foreground">Runs with fewer reports will not grant honor.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="honor-per-run">Honor per Verified Run</Label>
              <Input id="honor-per-run" type="number" defaultValue="50" />
               <p className="text-sm text-muted-foreground">HP awarded to each participant of a verified run.</p>
            </div>
          </div>
          <Button>Save Verification Rules</Button>
        </CardContent>
      </Card>
    </div>
  );
}
