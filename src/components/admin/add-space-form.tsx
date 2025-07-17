"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { addSpace } from "@/lib/actions";

const formSchema = z.object({
  name: z.string().min(3, { message: "Le nom de l'Espace doit comporter au moins 3 caractères." }),
  projectUrl: z.string().url({ message: "Veuillez saisir une URL valide." }),
  date: z.date({ required_error: "Une date est requise." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Veuillez saisir une heure valide au format HH:MM." }),
});

export function AddSpaceForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectUrl: "",
      time: "18:00",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const [hours, minutes] = values.time.split(":").map(Number);
    const combinedDateTime = new Date(values.date);
    combinedDateTime.setUTCHours(hours, minutes, 0, 0);

    try {
        await addSpace({
            name: values.name,
            projectUrl: values.projectUrl,
            dateTime: combinedDateTime.toISOString(),
        });
        toast({
            title: "Espace ajouté !",
            description: "Le nouvel Espace a été ajouté avec succès au programme.",
        });
        form.reset();
    } catch (error) {
        toast({
            title: "Erreur",
            description: "Échec de l'ajout du nouvel Espace. Veuillez réessayer.",
            variant: "destructive",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'Espace</FormLabel>
              <FormControl>
                <Input placeholder="ApeChain Community Call" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="projectUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL du projet</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Date (UTC)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                            ) : (
                                <span>Choisir une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            locale={fr}
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Heure (UTC 24h)</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Ajout en cours..." : "Ajouter l'Espace"}
        </Button>
      </form>
    </Form>
  );
}
