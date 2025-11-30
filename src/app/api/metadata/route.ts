import { NextRequest, NextResponse } from "next/server";
import { LinkMetadata } from "@/types/link";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OoozzyBot/1.0; +https://notes.ooozzy.com)",
      },
      // Set a timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract metadata from HTML
    const metadata: LinkMetadata = {
      title: extractMetaTag(html, "og:title") || extractTitle(html) || domain,
      description:
        extractMetaTag(html, "og:description") ||
        extractMetaTag(html, "description"),
      favicon:
        extractMetaTag(html, "og:image") ||
        extractLink(html, "icon") ||
        extractLink(html, "shortcut icon") ||
        `${parsedUrl.origin}/favicon.ico`,
      image: extractMetaTag(html, "og:image"),
      domain,
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error fetching metadata:", error);

    // Fallback: return basic metadata from URL
    try {
      const parsedUrl = new URL(url);
      const fallbackMetadata: LinkMetadata = {
        title: parsedUrl.hostname,
        domain: parsedUrl.hostname,
        favicon: `${parsedUrl.origin}/favicon.ico`,
      };
      return NextResponse.json(fallbackMetadata);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL or failed to fetch metadata" },
        { status: 500 }
      );
    }
  }
}

// Helper functions to extract metadata from HTML

function extractMetaTag(html: string, property: string): string | undefined {
  // Try Open Graph tags
  const ogRegex = new RegExp(
    `<meta\\s+property=["']og:${property}["']\\s+content=["']([^"']+)["']`,
    "i"
  );
  const ogMatch = html.match(ogRegex);
  if (ogMatch && ogMatch[1]) return ogMatch[1];

  // Try standard meta tags
  const metaRegex = new RegExp(
    `<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`,
    "i"
  );
  const metaMatch = html.match(metaRegex);
  if (metaMatch && metaMatch[1]) return metaMatch[1];

  // Try Twitter tags
  const twitterRegex = new RegExp(
    `<meta\\s+name=["']twitter:${property}["']\\s+content=["']([^"']+)["']`,
    "i"
  );
  const twitterMatch = html.match(twitterRegex);
  if (twitterMatch && twitterMatch[1]) return twitterMatch[1];

  return undefined;
}

function extractTitle(html: string): string | undefined {
  const titleRegex = /<title>([^<]+)<\/title>/i;
  const match = html.match(titleRegex);
  return match ? match[1].trim() : undefined;
}

function extractLink(html: string, rel: string): string | undefined {
  const linkRegex = new RegExp(
    `<link\\s+rel=["']${rel}["']\\s+href=["']([^"']+)["']`,
    "i"
  );
  const match = html.match(linkRegex);
  return match ? match[1] : undefined;
}
