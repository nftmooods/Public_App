"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Space } from "./types";
import { addSpace as addSpaceToDb } from "./data";

const SpaceSchema = z.object({
  name: z.string(),
  projectUrl: z.string().url(),
  dateTime: z.string().datetime(),
});

export async function addSpace(newSpace: Omit<Space, "id">) {
  try {
    const validatedSpace = SpaceSchema.parse(newSpace);
    await addSpaceToDb(validatedSpace);
    revalidatePath("/");
    return { success: true, message: "Space added successfully." };
  } catch (error) {
    console.error("Failed to add space:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Invalid data.", errors: error.errors };
    }
    return { success: false, message: "An unexpected error occurred." };
  }
}
