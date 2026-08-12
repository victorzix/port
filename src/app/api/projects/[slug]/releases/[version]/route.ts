import { NextResponse } from "next/server";

import { verifyApiToken } from "@/lib/api-auth";
import { projectSlugSchema } from "@/lib/validations/project";
import { upsertReleaseSchema, versionParamSchema } from "@/lib/validations/release";
import {
  ProjectNotFoundError,
  upsertRelease,
} from "@/server/services/release-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string; version: string }> },
) {
  if (!verifyApiToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, version } = await params;

  const parsedSlug = projectSlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return NextResponse.json(
      { error: "Invalid slug", issues: parsedSlug.error.issues },
      { status: 400 },
    );
  }

  const parsedVersion = versionParamSchema.safeParse(version);
  if (!parsedVersion.success) {
    return NextResponse.json(
      { error: "Invalid version", issues: parsedVersion.error.issues },
      { status: 400 },
    );
  }

  const parsed = upsertReleaseSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const { created } = await upsertRelease(
      parsedSlug.data,
      parsedVersion.data,
      parsed.data,
    );
    return NextResponse.json(
      { slug: parsedSlug.data, version: parsedVersion.data },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
