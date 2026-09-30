import { DEFAULT_ISIT_VERSION, loadIsitTaxonomy, toTreePayload } from "@/lib/isit-taxonomy/taxonomy";

/**
 * The whole taxonomy as static JSON for client-side tree views. Generated at build time from the
 * versioned files; the URL contains the version, so browsers may cache it forever.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ version: DEFAULT_ISIT_VERSION }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params;
  return Response.json(toTreePayload(loadIsitTaxonomy(version)), {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
