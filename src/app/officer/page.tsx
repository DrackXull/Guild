'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Shield, ScrollText, Users, FileText, Gem, Loader2, UserCheck, Store, Wand2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationReview } from "@/components/officer/application-review";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import type { Quest, WithId, Application, Player, Rank } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { MarketAdmin } from "@/components/market/market-admin";
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser } from "@/firebase";
import { collection, query, orderBy, doc, where } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiSettingsAdmin } from "@/components/officer/ai-settings-admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BountyAdmin } from "@/components/officer/bounty-admin";
import { Badge } from "@/components/ui/badge";
import { GuildSettingsAdmin } from "@/components/officer/guild-settings-admin";

const guildRanks: { rank: string; description: string; honorRequirement: number }[] = [
    { rank: 'Neophyte', description: 'A new recruit, learning the ropes and proving their worth in the dungeons.', honorRequirement: 0 },
    { rank: 'Initiate', description: 'A member who has shown dedication and completed several successful runs.', honorRequirement: 1000 },
    { rank: 'Soldier', description: 'A dependable combatant, regularly participating in guild activities and runs.', honorRequirement: 2500 },
    { rank: 'Knight', description: 'A proven warrior, respected for their skill, honor, and commitment to the guild.', honorRequirement: 10000 },
    { rank: 'Champion', description: 'A celebrated hero of the guild, known for their exceptional prowess and numerous victories.', honorRequirement: 50000 },
    { rank: 'Elder', description: 'A veteran member whose wisdom and experience are invaluable to the guild council.', honorRequirement: 100000 },
];

function MemberRosterAdmin() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('displayName'));
  }, [firestore]);

  const { data: players, isLoading } = useCollection<Player>(playersQuery);

  const handleRankChange = (playerId: string, newRank: Rank) => {
    if (!firestore) return;
    const playerDocRef = doc(firestore, 'players', playerId);
    setDocumentNonBlocking(playerDocRef, { rank: newRank }, { merge: true });
    toast({
      title: "Rank Updated",
      description: `The member's rank has been updated to ${newRank}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserCheck className="h-6 w-6" />
          <CardTitle className="font-headline text-2xl">Member Roster</CardTitle>
        </div>
        <CardDescription>View all guild members and manage their ranks.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Lifetime Honor</TableHead>
              <TableHead className="w-48">Rank</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && players?.map(player => (
              <TableRow key={player.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={player.avatarUrl} />
                      <AvatarFallback>{player.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{player.displayName}</div>
                      <div className="text-sm text-muted-foreground">{player.discordTag}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{(player.lifetimeHonor || 0).toLocaleString()}</TableCell>
                <TableCell>
                  <Select onValueChange={(value) => handleRankChange(player.id, value as Rank)} value={player.rank || 'Neophyte'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                      {guildRanks.map(r => (
                        <SelectItem key={r.rank} value={r.rank}>{r.rank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
             {!isLoading && (!players || players.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


function ApplicantsAdmin() {
  const firestore = useFirestore();

  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'applications'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: applications, isLoading: isLoadingApplications } = useCollection<Application>(applicationsQuery);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <CardTitle className="font-headline text-2xl">Applicant Trials</CardTitle>
        </div>
        <CardDescription>Review, rate, and decide on new guild applicants.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Reviews</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingApplications && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!isLoadingApplications && applications?.map(app => {
              const reviewCount = app.reviewHistory?.length || 0;
              return (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.applicantName}</div>
                    <div className="text-sm text-muted-foreground">{app.discordTag}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center capitalize">
                    <Badge variant={app.status === 'approved' ? 'default' : app.status === 'denied' ? 'destructive' : 'secondary'}>
                        {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{reviewCount}</TableCell>
                  <TableCell className="text-right">
                    <ApplicationReview application={app} />
                  </TableCell>
                </TableRow>
              );
            })}
              {!isLoadingApplications && (!applications || applications.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No applications found.
                  </TableCell>
              </TableRow>
              )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function LogsAdmin() {
  return (
     <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <CardTitle className="font-headline text-2xl">Council Activity Log</CardTitle>
          </div>
          <CardDescription>
            A transparent record of all council and automated guild actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Activity log coming soon...</p>
        </CardContent>
      </Card>
  )
}


export default function OfficerPage() {
  const { user } = useUser();
  const isGuildLeader = user?.email?.toLowerCase() === 'huzzinda@gmail.com';
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleGrantAdmin = () => {
      if (isProcessing || !firestore || !user) return;

      setIsProcessing(true);
      const adminRoleRef = doc(firestore, `roles_admin/${user.uid}`);
      const officerRoleRef = doc(firestore, `roles_officer/${user.uid}`);
      const playerDocRef = doc(firestore, `players/${user.uid}`);

      const newPlayerData: Omit<Player, 'id'> = {
          displayName: user.email?.split('@')[0] || 'Guild Leader',
          discordTag: 'Admin#0001',
          friends: [],
          isOnline: true,
          lifetimeHonor: 100000,
          currentHonor: 100000,
          maxHonor: 100000,
          role: 'admin',
          rank: 'Elder',
      };
      
      setDocumentNonBlocking(adminRoleRef, { assignedAt: new Date().toISOString() });
      setDocumentNonBlocking(officerRoleRef, { assignedAt: new Date().toISOString() });
      setDocumentNonBlocking(playerDocRef, newPlayerData, { merge: true });

      toast({
          title: "Guild Leader Role Assigned",
          description: "Your player profile has been created. The page will now reload to grant you full access.",
          duration: 5000,
      });
      
      setTimeout(() => window.location.reload(), 2000);
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Shield className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-wide">Council Chambers</h1>
          <p className="text-muted-foreground mt-1">Manage guild settings, applications, bounties, and the market.</p>
        </div>
      </div>
      
      {isGuildLeader && (
        <Card className="border-primary/50">
          <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-3"><Shield className="text-primary"/> First-Time Admin Setup</CardTitle>
              <CardDescription>
                  This is a one-time setup to grant your account full administrative privileges and create your player profile.
              </CardDescription>
          </CardHeader>
          <CardFooter>
                <Button onClick={handleGrantAdmin} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Shield className="mr-2 h-4 w-4"/>}
                  Force Admin Init
              </Button>
          </CardFooter>
        </Card>
      )}

      <Tabs defaultValue="applicants" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="settings"><Landmark className="mr-2 h-4 w-4" />Guild</TabsTrigger>
          <TabsTrigger value="applicants"><Users className="mr-2 h-4 w-4" />Applicants</TabsTrigger>
          <TabsTrigger value="roster"><UserCheck className="mr-2 h-4 w-4" />Roster</TabsTrigger>
          <TabsTrigger value="bounties"><ScrollText className="mr-2 h-4 w-4" />Bounties</TabsTrigger>
          <TabsTrigger value="market"><Store className="mr-2 h-4 w-4" />Market</TabsTrigger>
          <TabsTrigger value="ai-settings"><Wand2 className="mr-2 h-4 w-4" />AI Settings</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="mr-2 h-4 w-4" />Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <GuildSettingsAdmin />
        </TabsContent>

        <TabsContent value="applicants" className="mt-6">
          <ApplicantsAdmin />
        </TabsContent>

        <TabsContent value="roster" className="mt-6">
          <MemberRosterAdmin />
        </TabsContent>
        
        <TabsContent value="bounties" className="mt-6">
          <BountyAdmin />
        </TabsContent>
        
        <TabsContent value="market" className="mt-6">
          <MarketAdmin />
        </TabsContent>

        <TabsContent value="ai-settings" className="mt-6">
          <AiSettingsAdmin />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          <LogsAdmin />
        </TabsContent>

      </Tabs>
    </div>
  );
}
