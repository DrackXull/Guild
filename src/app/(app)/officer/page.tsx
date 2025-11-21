'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ScrollText, Users, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBounties } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationReview } from "@/components/officer/application-review";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockApplications, mockReviews } from "@/lib/data";
import { useEffect, useState, useTransition } from "react";
import type { Quest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";


export default function OfficerPage() {
  const { toast } = useToast();
  const [bounties, setBounties] = useState<Quest[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const fetchedBounties = await getBounties();
      setBounties(fetchedBounties);
    });
  }, []);
  
  const applications = mockApplications;
  const reviews = mockReviews;

  const handleCreateBounty = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as 'daily' | 'weekly';
    const reward = formData.get('reward') as string;

    if (!title || !description || !type || !reward) {
        toast({
            title: "Missing Fields",
            description: "Please fill out all bounty information.",
            variant: "destructive",
        });
        return;
    }

    const newBounty: Quest = {
        questName: title,
        questDescription: description,
        questType: type,
        reward: `${reward} Honor`,
    };

    setBounties(prev => [newBounty, ...prev]);
    toast({
        title: "Bounty Created",
        description: `The bounty "${title}" has been added.`,
    });
    (event.target as HTMLFormElement).reset();
  }

  const handleRemoveBounty = (questName: string) => {
    setBounties(prev => prev.filter(b => b.questName !== questName));
    toast({
        title: "Bounty Removed",
        description: `The bounty "${questName}" has been removed.`,
        variant: "destructive"
    });
  }

  return (
    <div className="space-y-8">
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
              <Users className="h-6 w-6" />
              <CardTitle className="font-headline text-2xl">Applicant Review</CardTitle>
          </div>
          <CardDescription>Review, rate, and decide on new guild applicants.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-center">Reviews</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map(app => {
                const appReviews = reviews.filter(r => r.applicationId === app.id);
                const avgScore = appReviews.length > 0 ? appReviews.reduce((acc, r) => acc + r.vote, 0) / appReviews.length : 0;
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.applicantName}</div>
                      <div className="text-sm text-muted-foreground">{app.discordTag}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">{appReviews.length}</TableCell>
                    <TableCell className="text-center font-mono">{avgScore.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      <ApplicationReview application={app} reviews={appReviews} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />

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
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                    {isPending && <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}
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
                                <Button size="sm" variant="destructive" onClick={() => handleRemoveBounty(bounty.questName)}>
                                    <Trash2 className="h-4 w-4 mr-2"/>
                                    Remove
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    {!isPending && bounties.length === 0 && <p className="text-muted-foreground text-center py-8">No active bounties.</p>}
                </div>
            </div>
            <form className="space-y-4" onSubmit={handleCreateBounty}>
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
                        <Select name="type" required>
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
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <CardTitle className="font-headline text-2xl">Admin Activity Log</CardTitle>
          </div>
          <CardDescription>
            A transparent record of all officer and automated guild actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground text-sm">Activity log coming soon...</p>
        </CardContent>
      </Card>

    </div>
  );
}
