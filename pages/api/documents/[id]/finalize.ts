import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getGeneratedDocumentById, getTemplateById, getTemplateVersionById } from "../../../../lib/documents";
import { renderDocumentHtml } from "../../../../lib/renderDocument";

/**
 * Deliberately a Pages Router API route, not an App Router Route
 * Handler - Next's App Router bundler hard-blocks any module reachable
 * from anything under app/ that imports react-dom/server (the
 * "importing a component that imports react-dom/server" build error),
 * and that turned out to apply to Route Handlers too, not just Server
 * Components/Actions. Pages Router API routes sit outside that
 * restriction entirely, which is what lets renderDocumentHtml (using
 * renderToStaticMarkup - not Puppeteer, not a headless browser, not
 * PDF generation) actually run.
 *
 * Same cookie-based Supabase auth check as the rest of the app, just
 * adapted to the Pages Router (req, res) signature instead of
 * next/headers' cookies() - that helper is App Router-only.
 *
 * Renders using the template VERSION already locked onto this
 * document at generation time (doc.template_version_id), not whatever
 * the "current" template version happens to be right now - a
 * generated draft, and its Preview/Edit This Copy flow, always used
 * that same locked-in version, so finalization has to match it exactly
 * rather than silently picking up newer wording.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const id = req.query.id as string;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          res.setHeader("Set-Cookie", `${name}=${value}; Path=/; ${options?.httpOnly ? "HttpOnly;" : ""}`);
        },
        remove(name: string) {
          res.setHeader("Set-Cookie", `${name}=; Path=/; Max-Age=0`);
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }

  const doc = await getGeneratedDocumentById(id);
  if (!doc) {
    return res.status(404).json({ success: false, error: "Document not found." });
  }
  if (doc.status === "finalized") {
    return res.status(200).json({ success: true });
  }

  const [template, version] = await Promise.all([
    getTemplateById(doc.template_id),
    getTemplateVersionById(doc.template_version_id),
  ]);
  if (!template || !version) {
    return res.status(500).json({ success: false, error: "The document's template is missing." });
  }

  const effectiveData = doc.edited_content || doc.resolved_data;
  const renderedHtml = await renderDocumentHtml(template.slug, version.content, effectiveData);

  const admin = createAdminClient();
  const { error } = await admin
    .from("generated_documents")
    .update({
      rendered_html: renderedHtml,
      status: "finalized",
      finalized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true });
}
