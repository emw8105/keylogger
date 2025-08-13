import { NextResponse } from "next/server"

// Mock endpoint - replace with actual Firebase integration
export async function GET(request: Request, { params }: { params: { systemId: string } }) {
  try {
    const { systemId } = params

    // This would typically fetch from Firebase
    // const response = await fetch(`http://keylogger.doypid.com/api/logs/${systemId}`)

    // Mock response for now
    const mockLogs = {
      "27214215126422": [
        {
          id: "1",
          logDurationSeconds: 13.007452,
          logStartTimeUTC: "2025-08-11T15:43:32.100970Z",
          loggedContent: "first try on the exe",
          serverTimestamp: "August 11, 2025 at 3:43:43 PM UTC-5",
          systemInfo: {
            ActiveWindow: "script.py - keylogger - Visual Studio Code",
            Hostname: "DESKTOP-76GNVR1",
            OS: "Windows",
            OSRelease: "11",
            SystemID: "27214215126422",
            Username: "EMW81",
          },
        },
      ],
    }

    const logs = mockLogs[systemId as keyof typeof mockLogs] || []

    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
