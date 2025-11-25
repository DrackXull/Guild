
'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Application, ApplicationReview as TApplicationReview, Player, PartialPlayer, WithId, ApplicationReviewLog } from '@/lib/types';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';

type ApplicationReviewProps = {
  application: WithId<Application>;
};

export function ApplicationReview({ application }: ApplicationReviewProps) {
  const { toast } = useToast();
  const { user: officer } = useUser();
  const firestore = useFirestore();
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const officerIds = useMemo(() => application.reviewHistory?.map(r => r.officerId) || [], [application.reviewHistory]);

  const officersQuery = useMemoFirebase(() => {
    if (!firestore || officerIds.length === 0) return null;
    return query(collection(firestore, 'players'), where('id', 'in', officerIds));
  }, [firestore, officerIds]);

  const { data: officers } = useCollection<Player>(officersQuery);
  const getOfficer = (officerId: string) => officers?.find(o => o.id === officerId);

  const handleReviewSubmit = () => {
    if (!officer || !firestore) {
        toast({ title: "Authentication Error", description: "You must be logged in as an officer.", variant: "destructive"});
        return;
    }
    if (!notes.trim()) {
        toast({
            title: "Review Note Required",
            description: "Please provide a note with your review.",
            variant: "destructive"
        });
        return;
    }

    const appRef = doc(firestore, 'applications', application.id);
    
    const newReviewLog: ApplicationReviewLog = {
      officerId: officer.uid,
      decision: 'approved', // Placeholder, the real decision is on the whole app
      notes: notes,
      timestamp: new Date().toISOString(),
    };
    
    // Check if this officer has already reviewed
    const existingReviewIndex = application.reviewHistory?.findIndex(r => r.officerId === officer.uid) ?? -1;
    let updatedReviewHistory = [...(application.reviewHistory || [])];

    if (existingReviewIndex !== -1) {
        // Update existing review
        updatedReviewHistory[existingReviewIndex] = newReviewLog;
    } else {
        // Add new review
        updatedReviewHistory.push(newReviewLog);
    }
    
    setDocumentNonBlocking(appRef, { reviewHistory: updatedReviewHistory }, { merge: true });

    toast({
        title: "Review Submitted",
        description: `Your review for ${application.applicantName} has been recorded.`,
    });
    setNotes('');
    setRating(5);
  }
  
  const handleDecision = (decision: 'approved' | 'denied') => {
    if (!officer || !firestore) {
        toast({ title: "Authentication Error", description: "You must be logged in as an officer.", variant: "destructive"});
        return;
    }
    const appRef = doc(firestore, 'applications', application.id);
    
    if (decision === 'approved') {
        const playerRef = doc(firestore, 'players', application.userId);
        const newPlayerData: Partial<Player> = {
            displayName: application.applicantName,
            discordTag: application.discordTag,
            isOnline: false,
            lifetimeHonor: 100, // Starting honor
            currentHonor: 100,
            maxHonor: 100,
            role: 'member',
            isMember: true,
        };
        setDocumentNonBlocking(playerRef, newPlayerData, { merge: true });
        setDocumentNonBlocking(appRef, { status: 'approved' }, { merge: true });
        toast({ title: "Application Approved!", description: `${application.applicantName} is now a member of the guild.` });
    } else {
        setDocumentNonBlocking(appRef, { status: 'denied' }, { merge: true });
        toast({ title: "Application Denied", description: `The application for ${application.applicantName} has been denied.`, variant: "destructive"});
    }
    setIsOpen(false);
  }

  const existingReview = application.reviewHistory?.find(r => r.officerId === officer?.uid);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Review</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Review Application: {application.applicantName}</DialogTitle>
          <DialogDescription>{application.discordTag} - Applied on {new Date(application.createdAt).toLocaleDateString()}</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto p-1">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Original Application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                 <div>
                  <h4 className="font-semibold">Main Character(s) & Class(es)</h4>
                  <p className="text-muted-foreground">{application.mainCharacters} ({application.mainClasses.join(', ')})</p>
                </div>
                 <div>
                  <h4 className="font-semibold">Hours in Game</h4>
                  <p className="text-muted-foreground">~{application.hoursInGame} hours</p>
                </div>
                <div>
                  <h4 className="font-semibold">Favorite Modes</h4>
                  <p className="text-muted-foreground">{application.favoriteModes.join(', ')}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Memorable Experience</h4>
                  <p className="text-muted-foreground">{application.memorableExperience}</p>
                </div>
                 <div>
                  <h4 className="font-semibold">Guild Expectations</h4>
                  <p className="text-muted-foreground">{application.guildExpectations}</p>
                </div>
                 <div>
                  <h4 className="font-semibold">Availability</h4>
                  <p className="text-muted-foreground">{application.availabilityDays.join(', ')}</p>
                  <p className="text-muted-foreground">{application.availabilityStart} - {application.availabilityEnd} ({application.availabilityTimezone})</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                 <CardTitle className='font-headline'>Council Reviews ({application.reviewHistory?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.reviewHistory && application.reviewHistory.length > 0 ? application.reviewHistory.map(review => {
                  const reviewer = getOfficer(review.officerId);
                  return (
                    <div key={review.officerId} className="flex gap-3">
                      <Avatar className='mt-1'>
                        <AvatarImage src={reviewer?.avatarUrl} />
                        <AvatarFallback>{reviewer?.displayName.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{reviewer?.displayName || 'Unknown Officer'}</span>
                          {/* <Badge variant="secondary" className="font-mono">{review.vote}/10</Badge> */}
                        </div>
                        <p className="text-muted-foreground text-sm">{review.notes}</p>
                      </div>
                    </div>
                  )
                }) : <p className="text-muted-foreground text-sm">No reviews yet.</p>}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="sticky top-0">
              <CardHeader>
                 <CardTitle className='font-headline'>Your Review</CardTitle>
                 <CardDescription>Leave a note for other council members. This will overwrite your previous review if you've made one.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="officer-notes">Notes</Label>
                    <Textarea 
                        id="officer-notes" 
                        placeholder="Private notes visible only to other council members..." 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
              </CardContent>
               <CardFooter>
                <Button className="w-full" onClick={handleReviewSubmit}>{existingReview ? "Update Your Review" : "Submit Your Review"}</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => handleDecision('denied')}>Deny Application</Button>
              <Button onClick={() => handleDecision('approved')}>Approve Application</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
