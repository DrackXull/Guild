
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGuild, findGuild, makePublicTag, slugifyName, formatTagNumber } from "@/lib/guild";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from "@/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";

function GuildTitle() {
  return (
    <h1 className="font-headline text-4xl font-bold tracking-wide guild-title-word">
        Forge a New <span className="guild-title-gradient">Nexus</span>
    </h1>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [mode, setMode] = useState<"create" | "join">("create");

  const [name, setName] = useState("");
  const [game, setGame] = useState("Dark and Darker");
  const [tagNum, setTagNum] = useState(1);
  const [isTagChecking, setIsTagChecking] = useState(false);
  const [isTagAvailable, setIsTagAvailable] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [joinTag, setJoinTag] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  
  const debouncedName = useDebounce(name, 300);
  const debouncedTagNumber = useDebounce(tagNum, 300);
  
  const previewTag = makePublicTag(name || "guildname", tagNum);

  useEffect(() => {
    const checkTagAvailability = async () => {
        if (!firestore || !debouncedName || debouncedTagNumber < 1) {
            setIsTagAvailable(null);
            return;
        }

        setIsTagChecking(true);
        setIsTagAvailable(null);
        const publicTag = makePublicTag(debouncedName, debouncedTagNumber);

        try {
            const dirRef = doc(firestore, "guildDirectory", publicTag);
            const dirSnap = await getDoc(dirRef);
            setIsTagAvailable(!dirSnap.exists());
        } catch (error) {
            console.error("Error checking tag availability:", error);
            setIsTagAvailable(false);
        } finally {
            setIsTagChecking(false);
        }
    };

    checkTagAvailability();
  }, [firestore, debouncedName, debouncedTagNumber]);


  const handleCreate = async () => {
    setError("");
    if (!user) return setError("You must sign in first");
    setIsCreating(true);
    try {
      await createGuild({
        name,
        primaryGame: game,
        number: tagNum,
        uid: user.uid
      });
      toast({ title: "Guild Created!", description: "Redirecting to your new dashboard."});
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error creating guild", description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    setError("");
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to join a guild.", variant: "destructive" });
        return;
    }
    setIsJoining(true);
    const functions = getFunctions();
    const joinGuildFn = httpsCallable(functions, 'joinGuildByPublicTag');
    try {
        await joinGuildFn({ publicTag: joinTag });
        toast({
            title: "Application Sent!",
            description: `Your request to join the guild has been sent for review.`,
        });
        router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Failed to find guild", description: err.message, variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const renderAvailability = () => {
    if (isTagChecking) {
        return <span className="text-xs flex items-center text-muted-foreground"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Checking...</span>;
    }
    if (isTagAvailable === null) {
        return null;
    }
    if (isTagAvailable) {
        return <span className="text-xs flex items-center text-green-500"><CheckCircle className="mr-1 h-3 w-3" />Available</span>;
    }
    return <span className="text-xs flex items-center text-destructive"><XCircle className="mr-1 h-3 w-3" />Taken</span>;
  }

  if (isUserLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="h-8 w-8 animate-spin"/>
        </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="container mx-auto max-w-4xl py-12">
            <div className="flex flex-col items-center text-center mb-8">
            <GuildTitle />
            <p className="text-muted-foreground mt-2 max-w-2xl">
                Your journey begins here. Create a new guild to rally your allies, or join an existing one to lend your strength.
            </p>
            </div>

            <Tabs value={mode} onValueChange={(value) => setMode(value as "create" | "join")} className="w-full max-w-xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create a Guild</TabsTrigger>
                    <TabsTrigger value="join">Join a Guild</TabsTrigger>
                </TabsList>
                <TabsContent value="create">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Create a New Guild</CardTitle>
                            <CardDescription>
                                Establish a new community. Choose your name and tag wisely, as this will be your public identity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="space-y-2">
                               <Label htmlFor="guild-name">Guild Name</Label>
                               <Input id="guild-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., The Iron First" />
                           </div>
                           <div className="space-y-2">
                                <Label>Primary Game</Label>
                                <Select onValueChange={setGame} defaultValue={game}>
                                    <SelectTrigger><SelectValue placeholder="Select a game" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dark and Darker">Dark and Darker</SelectItem>
                                        <SelectItem value="Escape From Tarkov">Escape From Tarkov</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="tag-num">Vanity Tag</Label>
                                <Input id="tag-num" type="number" value={tagNum} onChange={(e) => setTagNum(parseInt(e.target.value, 10) || 1)} />
                            </div>

                            <div className="p-3 bg-muted/50 rounded-md border border-dashed flex items-center justify-between">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Public Tag:</span>
                                    <span className="ml-2 font-mono font-bold text-foreground">{previewTag}</span>
                                </div>
                                {renderAvailability()}
                            </div>

                            <Button onClick={handleCreate} className="w-full" disabled={isCreating || !name || !game || !isTagAvailable}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Create Guild
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="join">
                    <Card>
                        <CardHeader>
                           <CardTitle className="font-headline text-2xl">Join an Existing Guild</CardTitle>
                            <CardDescription>
                                Enter the public tag of the guild you wish to join. Your request will be sent to the guild's council for approval.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="join-tag">Guild Public Tag</Label>
                                <Input id="join-tag" type="text" value={joinTag} onChange={(e) => setJoinTag(e.target.value)} placeholder="e.g., the-iron-fist#001" />
                            </div>
                            <Button onClick={handleJoin} className="w-full" disabled={isJoining || !joinTag}>
                                {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Send Join Request
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            {error && <p className="text-red-500 mt-4 text-center text-sm">{error}</p>}
        </div>
    </div>
  );
}
