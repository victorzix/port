import { NextResponse } from "next/server";

import { verifyApiToken } from "@/lib/api-auth";
import { createProjectSchema } from "@/lib/validations/project";
import { createProject } from "@/server/services/project-service";

export async function POST(request: Request) {
  if (!verifyApiToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createProjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const project = await createProject(parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { error: `Project with slug "${parsed.data.slug}" already exists` },
        { status: 409 },
      );
    }
    throw error;
  }
}
