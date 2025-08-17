import { NextResponse } from "next/server";

interface LogEntry {
  logStartTimeUTC: string;
  logDurationSeconds: number;
  loggedContent: string;
  activeWindow: string;
  serverTimestamp: string;
}

export async function GET(
  request: Request,
  { params }: { params: { systemId: string } }
) {
  try {
    const { systemId } = params;
    const goServerBaseUrl = process.env.SERVER_BASE_URL;

    if (!goServerBaseUrl) {
      return NextResponse.json(
        { error: "Go server base URL not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${goServerBaseUrl}/api/getLogs/${systemId}/logs`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Failed to fetch logs for ${systemId} from Go server:`, response.status, errorData);
      return NextResponse.json(
        { error: `Failed to fetch logs from backend: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: { logs: LogEntry[] } = await response.json();
    return NextResponse.json({ logs: data.logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}