'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, FileText, Loader, Shield, UserX, XCircle } from 'lucide-react';
import type { Application, WithId } from '@/lib/types';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { GUILD_NAME } from '@/lib/config';

interface ApplicationStatusProps {
  application: WithId<Application>;
}

const statusInfo = {
  pending: {
    title: 'Petition Submitted',
    description: 'Your application has been received and is awaiting review by the council.',
    icon: <Clock className="h-10 w-10 text-primary" />,
    badgeVariant: 'secondary',
    badgeText: 'Pending Review',
  },
  'under-review': {
    title: 'Petition Under Review',
    description: 'The council has begun reviewing your application. A decision will be made soon.',
    icon: <Loader className="h-10 w-10 text-primary animate-spin" />,
    badgeVariant: 'default',
    badgeText: 'Under Review',
  },
  approved: {
    title: 'Petition Approved!',
    description: `Welcome to ${GUILD_NAME}! You have been granted member access.`,
    icon: <CheckCircle className="h-10 w-10 text-success" />,
    badgeVariant: 'default',
    badgeClass: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
    badgeText: 'Approved',
  },
  denied: {
    title: 'Petition Denied',
    description:
      'After careful consideration, the council has decided not to move forward with your application at this time. You may withdraw and re-apply in the future.',
    icon: <XCircle className="h-10 w-10 text-destructive" />,
    badgeVariant: 'destructive',
    badgeText: 'Denied',
  },
  withdrawn: {
    title: 'Application Withdrawn',
    description: 'You have withdrawn your application. You are free to re-apply at any time.',
    icon: <UserX className="h-10 w-10 text-muted-foreground" />,
    badgeVariant: 'outline',
    badgeText: 'Withdrawn',
  },
};

export function ApplicationStatus({ application }: ApplicationStatusProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Determine the most relevant status
    const getDisplayStatus = (app: WithId<Application>): keyof typeof statusInfo => {
        if (app.status === 'denied') return 'denied';
        if (app.status === 'approved') return 'approved';
        if (app.status === 'withdrawn') return 'withdrawn';
        if (app.reviewHistory && app.reviewHistory.length > 0) return 'under-review';
        return 'pending';
    }

    const displayStatusKey = getDisplayStatus(application);
    const currentStatus = statusInfo[displayStatusKey];

    const handleWithdraw = () => {
        if (!firestore) return;
        const appRef = doc(firestore, 'applications', application.id);
        
        // This is a non-blocking update.
        deleteDocumentNonBlocking(appRef);

        toast({
            title: 'Application Withdrawn',
            description: 'Your petition has been successfully withdrawn.',
        });
    }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">{currentStatus.icon}</div>
        <CardTitle className="font-headline text-3xl">{currentStatus.title}</CardTitle>
        <div className="flex justify-center py-2">
            <Badge variant={currentStatus.badgeVariant as any} className={currentStatus.badgeClass}>
                {currentStatus.badgeText}
            </Badge>
        </div>
        <CardDescription className="pt-2">{currentStatus.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-4">
        <div className="border rounded-md p-4 bg-background/50">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><FileText className="h-4 w-4"/>Your Application</h4>
            <p><strong>Name:</strong> {application.applicantName}</p>
            <p><strong>In-Game Name:</strong> {application.inGameName}</p>
            <p><strong>Submitted:</strong> {new Date(application.createdAt).toLocaleString()}</p>
        </div>
        {application.reviewHistory && application.reviewHistory.length > 0 && (
             <div className="border rounded-md p-4 bg-background/50">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Shield className="h-4 w-4"/>Council Actions</h4>
                <ul className="space-y-1 list-disc pl-4">
                    {application.reviewHistory.map((review, index) => (
                        <li key={index}>
                           A council member reviewed your application on {new Date(review.timestamp).toLocaleDateString()}.
                        </li>
                    ))}
                </ul>
             </div>
        )}
      </CardContent>
      {(displayStatusKey === 'pending' || displayStatusKey === 'under-review' || displayStatusKey === 'denied') && (
        <CardContent>
            <Button variant="destructive" className="w-full" onClick={handleWithdraw}>
                Withdraw Petition
            </Button>
      </CardContent>
      )}
    </Card>
  );
}
