import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, ratio, durationInSeconds } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid code data" }, { status: 400 });
    }

    const cloudRunUrl = process.env.CLOUD_RUN_RENDERER_URL;

    if (!cloudRunUrl) {
      return NextResponse.json({ 
        error: "Cloud Run URL is not configured. Please deploy the render service and add CLOUD_RUN_RENDERER_URL to your .env file." 
      }, { status: 500 });
    }

    // Forward the request to the Cloud Run service
    const response = await fetch(cloudRunUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        ratio: ratio,
        durationInSeconds: durationInSeconds
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloud Run API Error:", errorText);
      return NextResponse.json({ error: `Cloud Run render failed: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Render API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
