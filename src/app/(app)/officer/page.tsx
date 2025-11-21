import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBounties } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default async function OfficerPage() {
  const bounties = await getBounties();

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
            <div className="flex items-center gap-3">
                <ScrollText className="h-6 w-6" />
                <CardTitle className="font-headline text-2xl">Bounty Administration</CardTitle>
            </div>
          <CardDescription>
            Create and manage daily and weekly bounties for the guild.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
                <h3 className="font-headline text-xl font-semibold">Active Bounties</h3>
                <div className="space-y-4">
                    {bounties.map(bounty => (
                        <Card key={bounty.questName} className="bg-background/50">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-semibold">{bounty.questName}</CardTitle>
                                        <CardDescription className="text-xs pt-1">{bounty.reward}</CardDescription>
                                    </div>
                                    <Badge variant={bounty.questType === 'daily' ? 'default' : 'secondary'}>{bounty.questType}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{bounty.questDescription}</p>
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button size="sm" variant="outline">Mark Complete</Button>
                                <Button size="sm" variant="destructive">Remove</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
            <form className="space-y-4">
                 <h3 className="font-headline text-xl font-semibold">Create New Bounty</h3>
                <div className="space-y-2">
                    <Label htmlFor="bounty-title">Bounty Title</Label>
                    <Input id="bounty-title" name="title" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bounty-desc">Description</Label>
                    <Textarea id="bounty-desc" name="description" rows={3} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="bounty-type">Type</Label>
                        <Select name="type">
                            <SelectTrigger id="bounty-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bounty-reward">Honor Reward</Label>
                        <Input id="bounty-reward" name="reward" type="number" placeholder="e.g., 100" required />
                    </div>
                </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="bounty-active" name="isActive" defaultChecked/>
                    <Label htmlFor="bounty-active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Activate this bounty immediately
                    </Label>
                </div>
                <Button type="submit" className="w-full">Create Bounty</Button>
            </form>
        </CardContent>
      </Card>
      
      <Separator />

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
