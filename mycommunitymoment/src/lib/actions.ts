"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Space } from "./types";
import { addSpace as addSpaceToDb } from "./data";

const SpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  projectUrl: z.string().url(),
  dateTime: z.string().datetime(),
  author: z.string().optional(),
});

export async function addSpace(newSpace: Omit<Space, "id">) {
  try {
    const validatedSpace = SpaceSchema.parse(newSpace);
    await addSpaceToDb(validatedSpace);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/console"); // also revalidate console
    return { success: true, message: "Space added successfully." };
  } catch (error) {
    console.error("Failed to add space:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Invalid data.", errors: error.errors };
    }
    return { success: false, message: "An unexpected error occurred." };
  }
}
