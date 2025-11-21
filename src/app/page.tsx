import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Swords } from 'lucide-react';
import { Icons } from '@/components/icons';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-dungeon');

  return (
    <div className="relative min-h-screen w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover object-center"
        />
      )}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center text-center text-foreground">
        <div className="container max-w-4xl">
          <div className="mb-8 flex justify-center">
            <Icons.logo className="h-24 w-24 text-primary" />
          </div>
          <h1 className="font-headline text-5xl font-bold tracking-wider md:text-7xl">
            Dark and Darker Guild Hub
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Track your runs, manage your characters, claim bounties, and rise through the ranks. Your guild's ultimate companion for conquering the dungeons.
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="font-bold text-lg">
              <Link href="/dashboard">
                <div className="flex items-center gap-2">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.369-.444.869-.608 1.259a18.19 18.19 0 00-4.844 0c-.164-.39-.422-.89-.632-1.259a.075.075 0 00-.079-.037A19.715 19.715 0 003.683 4.37a.074.074 0 00-.04.099c.142.337.297.677.437.994a19.106 19.106 0 00-1.637 4.958.076.076 0 00.044.09c.345.137.69.27.994.389a.076.076 0 00.09-.019c.125-.164.24-.337.355-.5.053.028.1.056.164.084a16.822 16.822 0 005.273 2.01.075.075 0 00.093-.037c.21-.368.443-.868.608-1.258a18.66 18.66 0 00-4.844 0c-.164.39-.422.89-.632 1.258a.075.075 0 00-.079.037A19.716 19.716 0 003.683 4.37a.074.074 0 00-.04.099c.142.337.297.677.437.994a19.106 19.106 0 00-1.637 4.958.076.076 0 00.044.09c.345.137.69.27.994.389a.076.076 0 00.09-.019c.125-.164.24-.337.355-.5.053.028.1.056.164.084a16.822 16.822 0 005.273 2.01.075.075 0 00.093-.037c.21-.368.443-.868.608-1.258.164.39.422.89.632 1.258a.075.075 0 00.093.037c1.55.438 3.203.74 4.885 1.515a.074.074 0 00.079-.037c.164-.39.422-.89.632-1.259a.075.075 0 00-.079-.037c-.6-.195-1.185-.438-1.74-.719a.075.075 0 00-.06-.099c-.142-.337-.297-.677-.437-.994a19.106 19.106 0 001.637-4.958.076.076 0 00-.044-.09c-.345-.137-.69-.27-.994-.389a.076.076 0 00-.09.019c-.125.164-.24.337-.355-.5a.075.075 0 00.019-.093c.125-.21.24-.422.355-.632.028-.056.028-.1.01-.137a18.66 18.66 0 00-4.844 0c.164-.39.422-.89.632-1.259a.075.075 0 00.079-.037c.6.195 1.185.438 1.74.719a.075.075 0 00.06.099c.142.337.297.677.437.994a.074.074 0 00.04.099 19.106 19.106 0 00-1.637 4.958.076.076 0 00.044-.09c.345-.137.69-.27.994-.389a.076.076 0 00.09-.019c.125-.164.24-.337.355-.5a.075.075 0 00-.019-.093c-.125-.21-.24-.422-.355-.632a.075.075 0 00-.01-.137c-.01-.01-.01-.01 0 0zm-7.029 10.157c-1.39 0-2.52-1.12-2.52-2.503s1.13-2.504 2.52-2.504c1.39 0 2.52 1.12 2.52 2.504s-1.13 2.503-2.52 2.503zm4.628 0c-1.39 0-2.52-1.12-2.52-2.503s1.13-2.504 2.52-2.504c1.39 0 2.52 1.12 2.52 2.504s-1.13 2.503-2.52 2.503z" /></svg>
                  <span>Login with Discord</span>
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
