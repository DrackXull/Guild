import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Gem } from "lucide-react";
import { mockPlayer } from "@/lib/data";
import { Button } from "@/components/ui/button";

const marketItems = [
    { name: "Minor Rune of Holding", description: "Increases your inventory space by one row.", price: 500, category: "Utility" },
    { name: "Flask of Fortune", description: "Slightly increases your luck for one dungeon run.", price: 250, category: "Consumable" },
    { name: "Scroll of Identification", description: "Reveals the properties of a single magic item.", price: 100, category: "Utility" },
    { name: "Guild Tabard", description: "A cosmetic tabard displaying the guild's crest.", price: 2000, category: "Cosmetic" },
    { name: "Officer's Commendation", description: "A note that can be exchanged for a rare crafting material from a guild officer.", price: 5000, category: "Special" },
    { name: "Elixir of the Iron Will", description: "Grants resistance to slows and stuns for 30 seconds.", price: 750, category: "Consumable" },
];

export default function MarketPage() {
    const player = mockPlayer;
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Store className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="font-headline text-4xl font-bold tracking-wide">Honor Market</h1>
                        <p className="text-muted-foreground mt-1">Spend your hard-earned Honor on valuable goods and services.</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <Gem className="h-5 w-5 text-primary"/>
                        <span className="text-2xl font-bold">{player.currentHonor.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Your Honor Points</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {marketItems.map((item) => (
                    <Card key={item.name} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                <div className="flex items-center gap-1.5 font-bold text-primary">
                                    <Gem className="h-4 w-4" />
                                    <span>{item.price.toLocaleString()}</span>
                                </div>
                            </div>
                           <CardDescription>{item.category}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Purchase</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
