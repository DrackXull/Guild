'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { players } from '@/lib/data';
import type { Application, ApplicationReview as TApplicationReview } from '@/lib/types';
import { useState } from 'react';

type ApplicationReviewProps = {
  application: Application;
  reviews: TApplicationReview[];
};

export function ApplicationReview({ application, reviews }: ApplicationReviewProps) {
  const [rating, setRating] = useState(5);
  const getPlayer = (playerId: string) => players.find(p => p.id === playerId);

  return (
    <Dialog>
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
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">Server / Region</h4>
                  <p className="text-muted-foreground text-sm">{application.server}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Playstyle Notes</h4>
                  <p className="text-muted-foreground text-sm">{application.notes}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                 <CardTitle className='font-headline'>Officer Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length > 0 ? reviews.map(review => {
                  const officer = getPlayer(review.adminPlayerId);
                  return (
                    <div key={review.adminPlayerId} className="flex gap-3">
                      <Avatar className='mt-1'>
                        <AvatarImage src={officer?.avatarUrl} />
                        <AvatarFallback>{officer?.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{officer?.displayName}</span>
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
                 <CardDescription>Rate the applicant and leave a note for other officers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="officer-rating">Applicant Rating: {rating}/10</Label>
                    <Slider defaultValue={[rating]} max={10} step={1} onValueChange={(v) => setRating(v[0])} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="officer-notes">Notes</Label>
                    <Textarea id="officer-notes" placeholder="Private notes visible only to other officers..." />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="destructive">Deny Application</Button>
          <Button>Approve Application</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
