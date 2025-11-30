import { NextRequest, NextResponse } from "next/server";

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
    // Proxy the request to the Puppeteer service (server-side, no CORS issues)
    // Use a longer timeout since screenshot generation can take time
    const screenshotResponse = await fetch(
      `https://noodleseed-puppeteer.creativelog.workers.dev/?url=${encodeURIComponent(
        url
      )}`,
      {
        // Increase timeout to 30 seconds for slow websites
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!screenshotResponse.ok) {
      throw new Error(
        `Puppeteer service returned ${screenshotResponse.status}`
      );
    }

    const screenshotData = await screenshotResponse.json();

    return NextResponse.json(screenshotData);
  } catch (error) {
    console.error("Error fetching screenshot:", error);
    // Return empty response instead of error status
    // This allows the link to still be saved without a screenshot
    return NextResponse.json({ url: null }, { status: 200 });
  }
}
