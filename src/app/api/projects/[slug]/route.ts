import { NextResponse } from "next/server";

import { verifyApiToken } from "@/lib/api-auth";
import { projectSlugSchema, upsertProjectSchema } from "@/lib/validations/project";
import { upsertProject } from "@/server/services/project-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!verifyApiToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const parsedSlug = projectSlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return NextResponse.json(
      { error: "Invalid slug", issues: parsedSlug.error.issues },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = upsertProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { created } = await upsertProject(parsedSlug.data, parsed.data);
  return NextResponse.json({ slug: parsedSlug.data }, { status: created ? 201 : 200 });
}
