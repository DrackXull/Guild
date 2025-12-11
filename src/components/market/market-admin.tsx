
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Trash2, Gem, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { MarketItem, Rank, WithId } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, orderBy, query } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { guildRanks } from "@/app/members/page";

export function MarketAdmin() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const itemsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'guild_bank_items');
    }, [firestore]);

    const itemsQuery = useMemoFirebase(() => {
        if (!itemsCollectionRef) return null;
        return query(itemsCollectionRef, orderBy('name'));
    }, [itemsCollectionRef]);

    const { data: items, isLoading } = useCollection<MarketItem>(itemsQuery);

    const handleCreateItem = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!itemsCollectionRef) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const price = formData.get('price') as string;
        const requiredRank = formData.get('requiredRank') as Rank | "none" | undefined;

        if (!name || !description || !category || !price) {
            toast({
                title: "Missing Fields",
                description: "Please fill out all item information.",
                variant: "destructive",
            });
            return;
        }

        const newItem: Omit<MarketItem, 'id'> = {
            name,
            description,
            category,
            price: parseInt(price, 10),
            quantity: 1, // Default quantity
            requiredRank: requiredRank === 'none' ? undefined : requiredRank,
        };

        addDocumentNonBlocking(itemsCollectionRef, newItem);
        toast({
            title: "Market Item Created",
            description: `The item "${name}" has been added to the market.`,
        });
        (event.target as HTMLFormElement).reset();
    }

    const handleRemoveItem = (itemId: string, itemName: string) => {
        if (!firestore) return;
        const itemDocRef = doc(firestore, 'guild_bank_items', itemId);
        deleteDocumentNonBlocking(itemDocRef);
        toast({
            title: "Market Item Removed",
            description: `The item "${itemName}" has been removed.`,
            variant: "destructive"
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Store className="h-6 w-6" />
                    <CardTitle className="font-headline text-2xl">Market Administration</CardTitle>
                </div>
                <CardDescription>
                    Add, remove, and manage items available in the Honor Market.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <h3 className="font-headline text-xl font-semibold">Market Items</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                        {isLoading && (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {!isLoading && (!items || items.length === 0) && (
                            <p className="text-muted-foreground text-center py-8">No items in the market.</p>
                        )}
                        {items?.map((item: WithId<MarketItem>) => (
                            <Card key={item.id} className="bg-background/50">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
                                            <CardDescription className="text-xs pt-1 flex items-center gap-1.5"><Gem className="h-3 w-3" />{item.price} Honor</CardDescription>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveItem(item.id, item.name)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                    {item.requiredRank && <p className="text-xs text-amber-400/80 mt-2">Requires: {item.requiredRank}</p>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
                <form className="space-y-4 sticky top-4" onSubmit={handleCreateItem}>
                    <h3 className="font-headline text-xl font-semibold">Add New Item</h3>
                    <div className="space-y-2">
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input id="item-name" name="name" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="item-desc">Description</Label>
                        <Textarea id="item-desc" name="description" rows={3} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-category">Category</Label>
                            <Input id="item-category" name="category" placeholder="e.g., Utility" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="item-price">Honor Price</Label>
                            <Input id="item-price" name="price" type="number" placeholder="e.g., 500" required />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="requiredRank">Required Rank (Optional)</Label>
                        <Select name="requiredRank">
                            <SelectTrigger id="requiredRank">
                                <SelectValue placeholder="No rank requirement" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {guildRanks.map(r => <SelectItem key={r.rank} value={r.rank}>{r.rank}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full">Add Item to Market</Button>
                </form>
            </CardContent>
        </Card>
    )
}

    