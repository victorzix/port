import { NextResponse } from "next/server";

import { verifyApiToken } from "@/lib/api-auth";
import { createChangelogEntrySchema } from "@/lib/validations/changelog";
import {
  ProjectNotFoundError,
  createChangelogEntry,
} from "@/server/services/changelog-service";

export async function POST(request: Request) {
  if (!verifyApiToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createChangelogEntrySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const entry = await createChangelogEntry(parsed.data);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
