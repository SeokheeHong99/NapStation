import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "../../../lib/auth";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const bucketName = "comment-images";

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase env vars are missing.");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login required to upload comment images." },
      { status: 401 }
    );
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase env vars are missing." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("files");
  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }

  const supabase = getSupabase();
  const uploadedUrls: string[] = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      continue;
    }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `comments/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);
    uploadedUrls.push(publicUrl.publicUrl);
  }

  return NextResponse.json({ urls: uploadedUrls });
}
