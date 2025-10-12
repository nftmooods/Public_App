
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calculator,
  Clock,
  Database,
  DollarSign,
  Save,
  Target,
  Trash2,
  TrendingUp,
  Coins,
  Pencil,
  Upload,
  Download
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  investment: z.coerce.number().positive({ message: "Must be positive." }),
  tokens: z.coerce.number().positive({ message: "Must be positive." }),
  tokenPrice: z.coerce
    .number()
    .positive({ message: "Must be positive." }),
  multiplier: z.string(),
  customMultiplier: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CalculationResult {
  buyPriceEth: number;
  buyPriceUsd: number;
  breakEvenPriceEth: number;
  breakEvenUsd: number;
  targetPriceEth: number;
  targetPriceUsd: number;
  targetValueEth: number;
  targetValueUsd: number;
  netProfitEth: number;
  netProfitUsd: number;
  displayMultiplier: number;
  investmentUsd: number;
}

interface HistoryItem extends FormData {
  id: number;
  date: string;
  ethPrice: number;
  results: CalculationResult;
}

export function ProfitCalculator() {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("calculator");
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      investment: 0,
      tokens: 0,
      tokenPrice: 0,
      multiplier: "2",
      customMultiplier: 0,
    },
  });
  
  const multiplierValue = form.watch("multiplier");
  const showCustomMultiplier = multiplierValue === "custom";

  useEffect(() => {
    async function fetchEthPrice() {
      try {
        setIsPriceLoading(true);
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        if (data && data.ethereum && data.ethereum.usd) {
          setEthPrice(data.ethereum.usd);
        } else {
          setEthPrice(3000); // Fallback price
        }
      } catch (error) {
        console.error("Error fetching ETH price:", error);
        setEthPrice(3000); // Fallback price
        toast({ title: "Error", description: "Could not fetch ETH price. Using a fallback value.", variant: "destructive"});
      } finally {
        setIsPriceLoading(false);
      }
    }

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 60000);

    // Using try-catch for localStorage access to avoid crashes in SSR or restricted envs
    try {
      const savedHistory = localStorage.getItem("vibestrHistory");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Ensure numeric fields are numbers for old data
        const correctedHistory = parsedHistory.map((item: any) => ({
          ...item,
          investment: Number(item.investment),
          tokens: Number(item.tokens),
          tokenPrice: Number(item.tokenPrice),
          customMultiplier: item.customMultiplier ? Number(item.customMultiplier) : undefined,
          results: {
            ...item.results,
            buyPriceEth: Number(item.results.buyPriceEth),
            buyPriceUsd: Number(item.results.buyPriceUsd),
            breakEvenPriceEth: Number(item.results.breakEvenPriceEth),
            breakEvenUsd: Number(item.results.breakEvenUsd),
            targetPriceEth: Number(item.results.targetPriceEth),
            targetPriceUsd: Number(item.results.targetPriceUsd),
            targetValueEth: Number(item.results.targetValueEth),
            targetValueUsd: Number(item.results.targetValueUsd),
            netProfitEth: Number(item.results.netProfitEth),
            netProfitUsd: Number(item.results.netProfitUsd),
            displayMultiplier: Number(item.results.displayMultiplier),
            investmentUsd: Number(item.results.investmentUsd)
          }
        }));
        setHistory(correctedHistory);
      }
    } catch (error) {
      console.warn("Could not load history from localStorage:", error);
    }
    

    return () => clearInterval(interval);
  }, [toast]);

  const onSubmit = (data: FormData) => {
    if (!ethPrice) {
      toast({ title: "Error", description: "ETH price not available. Please try again later.", variant: "destructive" });
      return;
    }

    const { investment, tokens, tokenPrice } = data;
    const currentMultiplier = data.multiplier === 'custom' && data.customMultiplier ? data.customMultiplier : Number(data.multiplier);

    if (!currentMultiplier || currentMultiplier <= 0) {
      toast({ title: "Invalid Multiplier", description: "Please enter a positive multiplier value.", variant: "destructive" });
      return;
    }

    const FEE_RATE = 0.10;
    const buyPriceEth = (investment * (1 - FEE_RATE)) / tokens;
    const breakEvenPriceEth = investment / (tokens * (1 - FEE_RATE));
    const targetPriceEth = (investment * currentMultiplier) / (tokens * (1 - FEE_RATE));
    const netProfitEth = (investment * currentMultiplier) - investment;
    const breakEvenRatio = breakEvenPriceEth / buyPriceEth;
    const targetRatio = targetPriceEth / buyPriceEth;

    const newResults: CalculationResult = {
      buyPriceEth,
      buyPriceUsd: tokenPrice,
      breakEvenPriceEth: breakEvenPriceEth,
      breakEvenUsd: tokenPrice * breakEvenRatio,
      targetPriceEth,
      targetPriceUsd: tokenPrice * targetRatio,
      targetValueEth: investment * currentMultiplier,
      targetValueUsd: investment * currentMultiplier * ethPrice,
      netProfitEth,
      netProfitUsd: netProfitEth * ethPrice,
      displayMultiplier: currentMultiplier,
      investmentUsd: tokenPrice * tokens
    };

    setResults(newResults);
  };

  const saveTrade = () => {
    if (!results || !ethPrice) {
       toast({ title: "Cannot Save", description: "Please calculate profit targets first.", variant: "destructive" });
       return;
    }
    const formValues = form.getValues();

    let updatedHistory: HistoryItem[];

    if (editingId) {
      // We are editing an existing item
      updatedHistory = history.map(item => {
        if (item.id === editingId) {
          return {
            ...item, // Keep original id and date
            ...formValues,
            investment: Number(formValues.investment),
            tokens: Number(formValues.tokens),
            tokenPrice: Number(formValues.tokenPrice),
            customMultiplier: formValues.customMultiplier ? Number(formValues.customMultiplier) : undefined,
            ethPrice: ethPrice,
            results,
          };
        }
        return item;
      });
      toast({ title: "Success!", description: "Trade has been updated in your history." });
    } else {
      // We are creating a new item
      const newHistoryItem: HistoryItem = {
        ...formValues,
        investment: Number(formValues.investment),
        tokens: Number(formValues.tokens),
        tokenPrice: Number(formValues.tokenPrice),
        customMultiplier: formValues.customMultiplier ? Number(formValues.customMultiplier) : undefined,
        id: Date.now(),
        date: new Date().toLocaleString(),
        ethPrice: ethPrice,
        results,
      };
      updatedHistory = [newHistoryItem, ...history];
      toast({ title: "Success!", description: "Trade has been saved to your history." });
    }

    setHistory(updatedHistory);
    setEditingId(null); // Reset editing mode
    form.reset({
      investment: 0,
      tokens: 0,
      tokenPrice: 0,
      multiplier: "2",
      customMultiplier: 0,
    });
    setResults(null);
    
    try {
      localStorage.setItem("vibestrHistory", JSON.stringify(updatedHistory));
      setActiveTab("history");
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
      toast({ title: "Error", description: "Could not save trade to history.", variant: "destructive"});
    }
  };

  const deletePurchase = (id: number) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    try {
      localStorage.setItem("vibestrHistory", JSON.stringify(updatedHistory));
      toast({ title: "Deleted", description: "Purchase removed from history." });
    } catch (error) {
      console.error("Failed to update history in localStorage", error);
      toast({ title: "Error", description: "Could not delete trade from history.", variant: "destructive"});
    }
  };

  const editPurchase = (item: HistoryItem) => {
    form.reset({
        investment: item.investment,
        tokens: item.tokens,
        tokenPrice: item.tokenPrice,
        multiplier: item.multiplier,
        customMultiplier: item.customMultiplier
    });
    setResults(item.results);
    setEditingId(item.id);
    setActiveTab("calculator");
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      toast({ title: "No Data", description: "There is no history to export.", variant: "destructive" });
      return;
    }

    const headers = [
      "id", "date", "ethPriceAtCalc", "investmentEth", "tokens", "tokenPriceUsd", "multiplier", "customMultiplier",
      "buyPriceEth", "buyPriceUsd", "breakEvenPriceEth", "breakEvenUsd", "targetPriceEth", "targetPriceUsd",
      "targetValueEth", "targetValueUsd", "netProfitEth", "netProfitUsd", "displayMultiplier", "investmentUsd"
    ];

    const rows = history.map(item => [
      item.id,
      `"${item.date}"`,
      item.ethPrice,
      item.investment,
      item.tokens,
      item.tokenPrice,
      item.multiplier,
      item.customMultiplier ?? '',
      item.results.buyPriceEth,
      item.results.buyPriceUsd,
      item.results.breakEvenPriceEth,
      item.results.breakEvenUsd,
      item.results.targetPriceEth,
      item.results.targetPriceUsd,
      item.results.targetValueEth,
      item.results.targetValueUsd,
      item.results.netProfitEth,
      item.results.netProfitUsd,
      item.results.displayMultiplier,
      item.results.investmentUsd
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vibestr_profit_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleImportCSV = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headers = rows.shift()?.split(',').map(h => h.trim()) ?? [];
        
        const newHistoryItems: HistoryItem[] = rows.map(row => {
          const values = row.split(',');
          const entry: { [key: string]: any } = headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {});

          // Basic validation and type conversion
          if (!entry.id || !entry.investmentEth || !entry.tokens) {
            throw new Error(`Skipping invalid row: ${row}`);
          }
          
          return {
            id: Number(entry.id),
            date: entry.date.replace(/"/g, ''),
            ethPrice: Number(entry.ethPriceAtCalc),
            investment: Number(entry.investmentEth),
            tokens: Number(entry.tokens),
            tokenPrice: Number(entry.tokenPriceUsd),
            multiplier: entry.multiplier,
            customMultiplier: entry.customMultiplier ? Number(entry.customMultiplier) : undefined,
            results: {
              buyPriceEth: Number(entry.buyPriceEth),
              buyPriceUsd: Number(entry.buyPriceUsd),
              breakEvenPriceEth: Number(entry.breakEvenPriceEth),
              breakEvenUsd: Number(entry.breakEvenUsd),
              targetPriceEth: Number(entry.targetPriceEth),
              targetPriceUsd: Number(entry.targetPriceUsd),
              targetValueEth: Number(entry.targetValueEth),
              targetValueUsd: Number(entry.targetValueUsd),
              netProfitEth: Number(entry.netProfitEth),
              netProfitUsd: Number(entry.netProfitUsd),
              displayMultiplier: Number(entry.displayMultiplier),
              investmentUsd: Number(entry.investmentUsd),
            }
          };
        });

        // Combine and remove duplicates, new items take precedence
        const combined = [...newHistoryItems, ...history];
        const uniqueHistory = Array.from(new Map(combined.map(item => [item.id, item])).values());
        
        uniqueHistory.sort((a,b) => b.id - a.id);

        setHistory(uniqueHistory);
        localStorage.setItem("vibestrHistory", JSON.stringify(uniqueHistory));
        toast({ title: "Success", description: "History imported successfully." });
      } catch (error: any) {
        console.error("Failed to import CSV", error);
        toast({ title: "Import Failed", description: error.message || "Could not parse the CSV file. Please check the format.", variant: "destructive" });
      } finally {
        // Reset file input
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    document.getElementById('csv-importer')?.click();
  }


  return (
    <div className="container mx-auto px-4 py-12 relative z-10">
      <header className="text-center mb-12">
        <div className="inline-block relative mb-6">
          <div className="absolute -inset-4 bg-primary rounded-full blur-xl opacity-30"></div>
          <div className="relative flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 rounded-full p-6 glow-effect">
            <TrendingUp className="w-12 h-12 text-purple-300" />
          </div>
        </div>
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-300 mb-3 font-headline">
          VibeStr Profit
        </h1>
        <p className="text-lg text-purple-200 max-w-2xl mx-auto">
          Your magical calculator for{" "}
          <span className="font-semibold text-purple-300">VIBESTR</span> profit
          strategies with 10% fee calculations
        </p>
        <div className="mt-6 inline-flex items-center bg-gray-900/70 backdrop-blur-md px-5 py-2 rounded-full border border-purple-400/30">
          {isPriceLoading ? (
             <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></div>
                <span className="text-purple-300 text-sm">Fetching ETH price...</span>
             </div>
          ) : (
            <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-300" />
                <span className="text-green-300 font-mono text-sm">Eth = {ethPrice?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
            </div>
          )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 p-1 h-auto">
          <TabsTrigger value="calculator" className="gap-2 data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300">
            <Calculator className="w-5 h-5" /> Calculator
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300">
            <Clock className="w-5 h-5" /> History ({history.length})
          </TabsTrigger>
        </TabsList>

        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-700/50 shadow-xl mt-1">
          <TabsContent value="calculator">
            <CardContent className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="investment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-200">Investment Amount (ETH)</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 font-mono font-bold text-lg">Ξ</span>
                               <Input type="number" step="any" placeholder="0.00" className="pl-8 pr-4 py-3 h-auto bg-gray-800/70 border-gray-700 focus:ring-purple-500" {...field} value={field.value || 0} />
                            </div>
                          </FormControl>
                           {results && <p className="text-xs text-gray-400 mt-1 h-4">≈ ${results.investmentUsd.toFixed(2)} USD at purchase</p>}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="tokens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-200">VIBESTR Tokens Received</FormLabel>
                           <FormControl>
                            <div className="relative">
                              <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4"/>
                              <Input type="number" step="any" placeholder="0.00" className="pl-10 pr-4 py-3 h-auto bg-gray-800/70 border-gray-700 focus:ring-purple-500" {...field} value={field.value || 0} />
                            </div>
                          </FormControl>
                          <FormMessage className="pt-1"/>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                     <FormField
                      control={form.control}
                      name="tokenPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-200">VIBESTR Price at Purchase (USD)</FormLabel>
                           <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4"/>
                              <Input type="number" step="any" placeholder="0.000000" className="pl-10 pr-4 py-3 h-auto bg-gray-800/70 border-gray-700 focus:ring-purple-500" {...field} value={field.value || 0} />
                            </div>
                          </FormControl>
                          <FormMessage className="pt-1"/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-200">Target Multiplier</FormLabel>
                          <div className="relative">
                            <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4 pointer-events-none"/>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={"2"}>
                              <FormControl>
                                <SelectTrigger className="pl-10 bg-gray-800/70 border-gray-700 focus:ring-purple-500 h-auto py-3">
                                  <SelectValue placeholder="Select a multiplier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                <SelectItem value="2">2x</SelectItem>
                                <SelectItem value="3">3x</SelectItem>
                                <SelectItem value="5">5x</SelectItem>
                                <SelectItem value="10">10x</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                           {showCustomMultiplier && (
                            <FormField
                              control={form.control}
                              name="customMultiplier"
                              render={({ field }) => (
                                <FormItem className="mt-2">
                                  <FormControl>
                                    <Input type="number" step="any" placeholder="Enter custom multiplier" className="bg-gray-800/70 border-gray-700" {...field} value={field.value || 0}/>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                           )}
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <Button type="submit" size="lg" className="px-10 py-4 h-auto bg-gradient-to-r from-purple-500 to-indigo-600 font-bold text-lg hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105 glow-effect">Calculate</Button>
                    <Button type="button" size="lg" onClick={saveTrade} className="px-10 py-4 h-auto bg-gradient-to-r from-green-500 to-emerald-600 font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 glow-effect">
                      <Save className="inline mr-2 w-5 h-5"/>
                      {editingId ? 'Update Trade' : 'Save Trade'}
                    </Button>
                  </div>
                </form>
              </Form>

              {results && (
                <div className="mt-8 pt-8 border-t border-gray-700/50 space-y-6">
                   <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-6 rounded-xl border border-purple-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-purple-300">Calculated Purchase Price</h3>
                            <div className="px-3 py-1 bg-purple-500/30 rounded-full text-xs font-medium">After 10% Fee</div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 font-mono">
                            <div>
                                <p className="text-sm text-purple-200 mb-1 font-sans">Per Token (ETH)</p>
                                <p className="text-2xl font-bold">Ξ {results.buyPriceEth.toFixed(8)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-purple-200 mb-1 font-sans">Per Token (USD)</p>
                                <p className="text-2xl font-bold">${results.buyPriceUsd.toFixed(6)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 rounded-xl border border-blue-500/20">
                            <h3 className="text-lg font-semibold text-blue-300 mb-4">Break-even Point</h3>
                            <div className="space-y-3 font-mono">
                                <div>
                                    <p className="text-sm text-blue-200 mb-1 font-sans">Sell Price (ETH)</p>
                                    <p className="text-2xl font-bold">Ξ {results.breakEvenPriceEth.toFixed(8)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-blue-200 mb-1 font-sans">Sell Price (USD)</p>
                                    {results.breakEvenUsd ? <p className="text-xl font-semibold">${results.breakEvenUsd.toFixed(6)}</p> : <p className="text-xl font-semibold">$0.000000</p>}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 rounded-xl border border-green-500/20">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-green-300">Target Profit</h3>
                                <div className="px-3 py-1 bg-green-500/30 rounded-full text-xs font-medium">{results.displayMultiplier}x</div>
                            </div>
                             <div className="space-y-3 font-mono">
                                <div>
                                    <p className="text-sm text-green-200 mb-1 font-sans">Target Sell Price (ETH)</p>
                                    <p className="text-2xl font-bold">Ξ {results.targetPriceEth.toFixed(8)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-green-200 mb-1 font-sans">Target Sell Price (USD)</p>
                                    {results.targetPriceUsd ? <p className="text-xl font-semibold">${results.targetPriceUsd.toFixed(6)}</p> : <p className="text-xl font-semibold">$0.000000</p>}
                                </div>
                                <div className="pt-2 border-t border-green-500/20">
                                    <p className="text-sm text-green-200 mb-1 font-sans">Expected Total Value</p>
                                    <p className="text-2xl font-bold">Ξ {results.targetValueEth.toFixed(6)}</p>
                                    {results.targetValueUsd ? <p className="text-lg font-semibold">${results.targetValueUsd.toFixed(2)}</p> : <p className="text-lg font-semibold">$0.00</p>}
                                </div>
                                <div className="pt-2 border-t border-green-500/20">
                                    <p className="text-sm text-green-200 mb-1 font-sans">Net Profit</p>
                                    <p className="text-2xl font-bold text-green-300">+Ξ {results.netProfitEth.toFixed(6)}</p>
                                    {results.netProfitUsd ? <p className="text-lg font-semibold text-green-300">+${results.netProfitUsd.toFixed(2)}</p> : <p className="text-lg font-semibold text-green-300">+$0.00</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              )}
            </CardContent>
          </TabsContent>
          <TabsContent value="history">
             <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Purchase History</CardTitle>
                    <div className="flex items-center gap-2">
                      <input type="file" id="csv-importer" accept=".csv" onChange={handleImportCSV} className="hidden" />
                      <Button variant="outline" size="sm" onClick={triggerImport}>
                          <Upload className="mr-2 h-4 w-4" /> Import CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportToCSV}>
                          <Download className="mr-2 h-4 w-4" /> Export CSV
                      </Button>
                    </div>
                </div>
             </CardHeader>
             <CardContent className="p-6 md:p-8 pt-0">
                {history.length === 0 ? (
                    <div className="text-center py-12">
                        <Database className="w-16 h-16 mx-auto text-gray-500" />
                        <h3 className="text-lg text-gray-400 mt-4">No purchases saved</h3>
                        <p className="text-gray-500 mt-2">Your saved calculations will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(item => (
                            <div key={item.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-medium text-white">{item.date}</h3>
                                        <p className="text-sm text-gray-400 font-mono">ETH Price: ${item.ethPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center">
                                      <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8" onClick={() => editPurchase(item)}>
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8" onClick={() => deletePurchase(item.id)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-4 gap-4 mt-3 font-mono">
                                    <div>
                                        <p className="text-xs text-purple-300 font-sans">Investment</p>
                                        <p>Ξ {Number(item.investment).toFixed(4)}</p>
                                        <p className="text-xs">(${(item.results.investmentUsd).toFixed(2)})</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-300 font-sans">VIBESTR</p>
                                        <p>{Number(item.tokens).toFixed(2)}</p>
                                        <p className="text-xs">@ ${Number(item.tokenPrice).toFixed(6)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-300 font-sans">Break-even</p>
                                        <p>Ξ {item.results.breakEvenPriceEth.toFixed(8)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-300 font-sans">Multiplier</p>
                                        <p>{item.results.displayMultiplier}x</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </CardContent>
          </TabsContent>
        </Card>
      </Tabs>
      <footer className="text-center text-gray-500 text-xs mt-8 space-y-1">
        <div>
          created by <a href="https://x.com/nftmooods" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition-colors">@nftmooods</a>
        </div>
        <div>
          <a href="https://opensea.io/item/ethereum/0xb8ea78fcacef50d41375e44e6814ebba36bb33c4/3273" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition-colors">Citizen of Vibetown #3273</a>
        </div>
      </footer>
    </div>
  );
}

    