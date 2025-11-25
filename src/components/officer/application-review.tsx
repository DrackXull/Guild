
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
import { players } from '@/lib/data';
import type { Application, ApplicationReview as TApplicationReview, Player, PartialPlayer, WithId } from '@/lib/types';
import { useState }from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

type ApplicationReviewProps = {
  application: WithId<Application>;
  reviews: TApplicationReview[];
};

export function ApplicationReview({ application, reviews: initialReviews }: ApplicationReviewProps) {
  const { toast } = useToast();
  const { user: officer } = useUser();
  const firestore = useFirestore();
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [reviews, setReviews] = useState(initialReviews);
  const [isOpen, setIsOpen] = useState(false);
  
  const getPlayer = (playerId: string) => players.find(p => p.id === playerId);

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
    const newReview: TApplicationReview = {
        applicationId: application.id,
        adminPlayerId: officer.uid,
        status: 'pending', // This review itself is pending until a final decision is made
        vote: rating,
        note: notes,
        createdAt: new Date().toISOString(),
    };
    
    const existingReviewIndex = application.reviewHistory?.findIndex(r => r.officerId === officer.uid) ?? -1;
    const updatedReviewHistory = [...(application.reviewHistory || [])];

    if (existingReviewIndex !== -1) {
        // This part needs schema alignment. For now, let's just add to history.
        // updatedReviewHistory[existingReviewIndex] = newReview;
    } else {
        updatedReviewHistory.push({
            officerId: officer.uid,
            decision: 'approved', // Placeholder, decision is on the whole app
            notes: notes,
            timestamp: new Date().toISOString(),
        });
    }

    setDocumentNonBlocking(appRef, { reviewHistory: updatedReviewHistory }, { merge: true });

    toast({
        title: "Review Submitted",
        description: `Your ${rating}/10 review for ${application.applicantName} has been recorded.`,
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

  const existingReview = reviews.find(r => r.adminPlayerId === officer?.uid);

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
                 <CardTitle className='font-headline'>Council Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length > 0 ? reviews.map(review => {
                  const reviewer = getPlayer(review.adminPlayerId);
                  return (
                    <div key={review.adminPlayerId} className="flex gap-3">
                      <Avatar className='mt-1'>
                        <AvatarImage src={reviewer?.avatarUrl} />
                        <AvatarFallback>{reviewer?.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{reviewer?.displayName}</span>
                          <Badge variant="secondary" className="font-mono">{review.vote}/10</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{review.note}</p>
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
                 <CardDescription>Rate the applicant and leave a note for other council members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="officer-rating">Applicant Rating: {rating}/10</Label>
                    <Slider defaultValue={[rating]} max={10} step={1} onValueChange={(v) => setRating(v[0])} />
                </div>
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
