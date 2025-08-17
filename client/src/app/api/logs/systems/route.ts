import { NextResponse } from "next/server";

interface SystemSummary {
  systemId: string;
  hostname: string;
  os: string;
  osRelease: string;
  username: string;
}

export async function GET() {
  try {
    const goServerBaseUrl = process.env.SERVER_BASE_URL;
    if (!goServerBaseUrl) {
      return NextResponse.json(
        { error: "Go server base URL not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${goServerBaseUrl}/api/systems`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch systems from Go server:", response.status, errorData);
      return NextResponse.json(
        { error: `Failed to fetch systems from backend: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: { systems: SystemSummary[] } = await response.json();
    return NextResponse.json({ systems: data.systems });
  } catch (error) {
    console.error("Error fetching systems:", error);
    return NextResponse.json(
      { error: "Failed to fetch systems" },
      { status: 500 }
    );
  }
}