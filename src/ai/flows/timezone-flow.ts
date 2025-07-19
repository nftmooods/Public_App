'use server';
/**
 * @fileOverview A flow to determine the IANA timezone from a city name.
 *
 * - getIANATimezone - A function that returns the IANA timezone for a given city.
 * - TimezoneInput - The input type for the getIANATimezone function.
 * - TimezoneOutput - The return type for the getIANATimezone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TimezoneInputSchema = z.object({
  city: z.string().describe('The name of a city.'),
});
export type TimezoneInput = z.infer<typeof TimezoneInputSchema>;

const TimezoneOutputSchema = z.object({
  timezone: z.string().describe("The IANA timezone name for the given city. For example, for 'Paris', it should be 'Europe/Paris'."),
});
export type TimezoneOutput = z.infer<typeof TimezoneOutputSchema>;

export async function getIANATimezone(input: TimezoneInput): Promise<TimezoneOutput> {
  return timezoneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'timezonePrompt',
  input: {schema: TimezoneInputSchema},
  output: {schema: TimezoneOutputSchema},
  prompt: `Given the city name, return the corresponding IANA timezone name. Only return the IANA timezone name.

City: {{{city}}}
`,
});

const timezoneFlow = ai.defineFlow(
  {
    name: 'timezoneFlow',
    inputSchema: TimezoneInputSchema,
    outputSchema: TimezoneOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
