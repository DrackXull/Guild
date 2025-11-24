
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useUser, setDocumentNonBlocking } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { doc, getFirestore } from 'firebase/firestore';
import type { Player } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { signInWithEmailAndPassword } from 'firebase/auth';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sign-in');
  
  const tabAudioRef = useRef<HTMLAudioElement>(null);
  const loginAudioRef = useRef<HTMLAudioElement>(null);
  const typingAudioRef = useRef<HTMLAudioElement>(null);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

   useEffect(() => {
    // If the user is logged in, send them to the most relevant page.
    if (!isUserLoading && user) {
        // AppManager in layout.tsx will handle redirection to /dashboard or /application-status
        // but we can push to a default here to be safe.
        router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }
  
  const playTabSound = () => {
    // tabAudioRef.current?.play().catch(e => console.error("Error playing tab sound:", e));
  }

  const playTypingSound = () => {
    // typingAudioRef.current?.play().catch(e => console.error("Error playing typing sound:", e));
  }

  const handleSignIn = (data: SignInFormValues) => {
    // loginAudioRef.current?.play().catch(e => console.error("Error playing login sound:", e));
    initiateEmailSignIn(auth, data.email, data.password);
  };

  const handleSignUp = (data: SignUpFormValues) => {
    initiateEmailSignUp(auth, data.email, data.password, () => {
        toast({
            title: 'Account Created & Signed In',
            description: 'Welcome! You are now logged in.',
        });
        // The useEffect will now handle the redirect
    });
  };
  
  const handleBecomeAdmin = async () => {
      const email = 'Huzzinda@gmail.com';
      const password = 'Password123!'; // A temporary, known password

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const firestore = getFirestore();
        
        const adminRoleRef = doc(firestore, `roles_admin/${user.uid}`);
        const playerDocRef = doc(firestore, `players/${user.uid}`);

        const newPlayerData: Omit<Player, 'id' | 'characters'> = {
            displayName: user.email?.split('@')[0] || 'Guild Leader',
            discordTag: 'Admin#0001',
            friends: [],
            isOnline: true,
            lifetimeHonor: 100000,
            currentHonor: 100000,
            maxHonor: 100000,
            avatarUrl: '',
            role: 'admin',
        };
        
        // These are non-blocking writes.
        setDocumentNonBlocking(adminRoleRef, { assignedAt: new Date().toISOString() });
        setDocumentNonBlocking(playerDocRef, newPlayerData);

        toast({
            title: "Welcome, Guild Leader!",
            description: "You have been logged in with full privileges.",
        });

      } catch (error) {
        console.error("Admin Login Error:", error);
         toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not log in as admin. Your account might not be created yet. Try signing up first.",
        });
      }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-dungeon');

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4">
      {heroImage && (
         <Image 
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover z-0"
            data-ai-hint={heroImage.imageHint}
         />
      )}
       <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="font-headline text-5xl text-primary leading-none">
                <div className="text-3xl font-semibold text-foreground/80 tracking-widest">The</div>
                Black Lantern
                <div className="text-4xl font-semibold text-foreground/80 -mt-2 tracking-widest">Company</div>
            </h1>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); playTabSound(); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in">
            <Card>
              <CardHeader>
                <CardTitle>Member & Applicant Login</CardTitle>
                <CardDescription>Enter your credentials to access the hub.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input id="email-signin" type="email" placeholder="m@example.com" {...signInForm.register('email')} onKeyDown={playTypingSound} />
                    {signInForm.formState.errors.email && <p className="text-destructive text-xs">{signInForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Password</Label>
                    <Input id="password-signin" type="password" {...signInForm.register('password')} onKeyDown={playTypingSound} />
                    {signInForm.formState.errors.password && <p className="text-destructive text-xs">{signInForm.formState.errors.password.message}</p>}
                  </div>
                  <Button type="submit" className="w-full">Sign In</Button>
                </form>
              </CardContent>
                <div className="relative px-6 pb-4">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-card px-2 text-xs text-muted-foreground">Or</span>
                </div>
                <CardFooter>
                    <Button variant="secondary" className="w-full" onClick={handleBecomeAdmin}>Log in as Guild Leader (Huzzinda@gmail.com)</Button>
                </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="sign-up">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Create a basic account to apply for membership.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input id="email-signup" type="email" placeholder="m@example.com" {...signUpForm.register('email')} onKeyDown={playTypingSound}/>
                     {signUpForm.formState.errors.email && <p className="text-destructive text-xs">{signUpForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input id="password-signup" type="password" {...signUpForm.register('password')} onKeyDown={playTypingSound}/>
                    {signUpForm.formState.errors.password && <p className="text-destructive text-xs">{signUpForm.formState.errors.password.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="confirmPassword-signup">Confirm Password</Label>
                    <Input id="confirmPassword-signup" type="password" {...signUpForm.register('confirmPassword')} onKeyDown={playTypingSound}/>
                    {signUpForm.formState.errors.confirmPassword && <p className="text-destructive text-xs">{signUpForm.formState.errors.confirmPassword.message}</p>}
                  </div>
                  <Button type="submit" className="w-full">Create Account</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="text-xs text-muted-foreground text-center w-full mt-4">
            Not affiliated with IRONMACE. All trademarks are the property of their respective owners.
        </p>
      </div>
      
      {/* Audio elements for sound effects - Add your audio files to the /public/sounds folder */}
      <audio ref={tabAudioRef} src="/sounds/rock-slide.mp3" preload="auto"></audio>
      <audio ref={loginAudioRef} src="/sounds/chest-unlock.mp3" preload="auto"></audio>
      <audio ref={typingAudioRef} src="/sounds/quill-writing.mp3" preload="auto"></audio>
    </div>
  );
}
