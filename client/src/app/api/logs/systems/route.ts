import { NextResponse } from "next/server"

// Mock endpoint - replace with actual Firebase integration
export async function GET() {
  try {
    // This would typically fetch from Firebase
    // const response = await fetch('http://keylogger.doypid.com/api/systems')

    // Mock response for now
    const systems = [
      {
        systemId: "27214215126422",
        hostname: "DESKTOP-76GNVR1",
        username: "EMW81",
        os: "Windows 11",
        lastActivity: "2025-08-11T16:12:15.456789Z",
      },
      {
        systemId: "98765432109876",
        hostname: "LAPTOP-ABC123",
        username: "TestUser",
        os: "Windows 10",
        lastActivity: "2025-08-11T14:30:45.123456Z",
      },
    ]

    return NextResponse.json({ systems })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch systems" }, { status: 500 })
  }
}
