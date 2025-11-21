import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";

export default function ApplyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
       <div className="flex flex-col items-center text-center mb-8">
        <UserPlus className="h-12 w-12 text-primary mb-4" />
        <h1 className="font-headline text-4xl font-bold tracking-wide">Join the Guild</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          We are looking for dedicated adventurers to join our ranks. Fill out the application below and our officers will review it.
        </p>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Application Form</CardTitle>
            <CardDescription>Tell us about yourself. The more detail, the better.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="applicantName">Name or Handle</Label>
                    <Input id="applicantName" name="applicantName" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="discordTag">Discord Tag</Label>
                    <Input id="discordTag" name="discordTag" placeholder="player#1234" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input id="email" name="email" type="email" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="server">Server / Region</Label>
                    <Input id="server" name="server" placeholder="e.g., NA-East" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="notes">Tell us about your playstyle</Label>
                    <Textarea id="notes" name="notes" rows={4} placeholder="What are your goals? What kind of teammate are you? What's your availability?" />
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" size="lg">Submit Application</Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
