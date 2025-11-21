import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card/80">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl tracking-wider">
            Guild Nexus
          </CardTitle>
          <CardDescription className="pt-2 text-base">
            Please log in or apply to join.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild size="lg" className="w-full font-bold text-lg">
            <Link href="/dashboard">
              Member Login
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full font-bold text-lg">
            <Link href="/apply">
              Apply to Guild
            </Link>
          </Button>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              Not affiliated with IRONMACE. All trademarks are the property of their respective owners.
            </p>
          </CardFooter>
      </Card>
    </div>
  );
}
