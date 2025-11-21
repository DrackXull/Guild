'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Trash2, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { MarketItem } from "@/lib/types";


interface MarketAdminProps {
    items: MarketItem[];
    setItems: React.Dispatch<React.SetStateAction<MarketItem[]>>;
}

export function MarketAdmin({ items, setItems }: MarketAdminProps) {
    const { toast } = useToast();

    const handleCreateItem = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const price = formData.get('price') as string;

        if (!name || !description || !category || !price) {
            toast({
                title: "Missing Fields",
                description: "Please fill out all item information.",
                variant: "destructive",
            });
            return;
        }

        const newItem: MarketItem = {
            name,
            description,
            category,
            price: parseInt(price, 10),
        };

        setItems(prev => [newItem, ...prev]);
        toast({
            title: "Market Item Created",
            description: `The item "${name}" has been added to the market.`,
        });
        (event.target as HTMLFormElement).reset();
    }

    const handleRemoveItem = (itemName: string) => {
        setItems(prev => prev.filter(item => item.name !== itemName));
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
                        {items.map(item => (
                            <Card key={item.name} className="bg-background/50">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
                                            <CardDescription className="text-xs pt-1 flex items-center gap-1.5"><Gem className="h-3 w-3" />{item.price} Honor</CardDescription>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveItem(item.name)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                         {items.length === 0 && <p className="text-muted-foreground text-center py-8">No items in the market.</p>}
                    </div>
                </div>
                <form className="space-y-4" onSubmit={handleCreateItem}>
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
                    <Button type="submit" className="w-full">Add Item to Market</Button>
                </form>
            </CardContent>
        </Card>
    )
}
