'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ScrollText, Users, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getBounties } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { ApplicationReview } from "@/components/officer/application-review";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { marketItems as initialMarketItems, mockApplications, mockReviews } from "@/lib/data";
import { useEffect, useState, useTransition } from "react";
import type { Quest, MarketItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { MarketAdmin } from "@/components/market/market-admin";


export default function OfficerPage() {
  const { toast } = useToast();
  const [bounties, setBounties] = useState<Quest[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>(initialMarketItems);
  const [isBountyPending, startBountyTransition] = useTransition();

  const fetchBounties = () => {
    startBountyTransition(async () => {
      const fetchedBounties = await getBounties();
      setBounties(fetchedBounties);
      toast({
        title: "Bounties Loaded",
        description: "The latest bounties have been loaded from the server."
      })
    });
  }

  useEffect(() => {
    fetchBounties();
  }, []);
  
  const applications = mockApplications;
  const reviews = mockReviews;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Shield className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-wide">Officer Lounge</h1>
          <p className="text-muted-foreground mt-1">Manage guild settings, applications, bounties, and the market.</p>
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ScrollText className="h-6 w-6" />
                    <CardTitle className="font-headline text-2xl">Guild Bounty Administration</CardTitle>
                </div>
                 <Button onClick={fetchBounties} disabled={isBountyPending}>
                    {isBountyPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Generate New Bounties
                </Button>
            </div>
          <CardDescription>
            Generate a new set of daily and weekly bounties for the guild using AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <h3 className="font-headline text-xl font-semibold">Active Bounties</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                {isBountyPending && (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {!isBountyPending && bounties.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No active bounties. Generate a new set to get started.</p>
                )}
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
                    </Card>
                ))}
            </div>
        </CardContent>
      </Card>
      
      <Separator />

      <MarketAdmin items={marketItems} setItems={setMarketItems} />

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
