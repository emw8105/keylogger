"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Terminal,
    ArrowLeft,
    Monitor,
    Clock,
    User,
    Eye,
    ChevronDown,
    ChevronRight,
    Keyboard,
    RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface SystemInfo {
    ActiveWindow: string
    Hostname: string
    OS: string
    OSRelease: string
    SystemID: string
    Username: string
}

interface LogEntry {
    id: string
    logDurationSeconds: number
    logStartTimeUTC: string
    loggedContent: string
    serverTimestamp: string
    systemInfo: SystemInfo
}

interface SystemGroup {
    systemId: string
    hostname: string
    username: string
    os: string
    logs: LogEntry[]
    expanded: boolean
}

export default function LogsPage() {
    const [systems, setSystems] = useState<SystemGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Mock data for demonstration - replace with actual API calls
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Mock data based on the provided structure
                const mockSystems: SystemGroup[] = [
                    {
                        systemId: "27214215126422",
                        hostname: "DESKTOP-76GNVR1",
                        username: "EMW81",
                        os: "Windows 11",
                        expanded: false,
                        logs: [
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
                            {
                                id: "2",
                                logDurationSeconds: 8.234567,
                                logStartTimeUTC: "2025-08-11T16:12:15.456789Z",
                                loggedContent: "testing the keylogger functionality",
                                serverTimestamp: "August 11, 2025 at 4:12:23 PM UTC-5",
                                systemInfo: {
                                    ActiveWindow: "Chrome - Google Search",
                                    Hostname: "DESKTOP-76GNVR1",
                                    OS: "Windows",
                                    OSRelease: "11",
                                    SystemID: "27214215126422",
                                    Username: "EMW81",
                                },
                            },
                        ],
                    },
                    {
                        systemId: "98765432109876",
                        hostname: "LAPTOP-ABC123",
                        username: "TestUser",
                        os: "Windows 10",
                        expanded: false,
                        logs: [
                            {
                                id: "3",
                                logDurationSeconds: 25.891234,
                                logStartTimeUTC: "2025-08-11T14:30:45.123456Z",
                                loggedContent: "hello world this is a test",
                                serverTimestamp: "August 11, 2025 at 2:31:11 PM UTC-5",
                                systemInfo: {
                                    ActiveWindow: "Notepad",
                                    Hostname: "LAPTOP-ABC123",
                                    OS: "Windows",
                                    OSRelease: "10",
                                    SystemID: "98765432109876",
                                    Username: "TestUser",
                                },
                            },
                        ],
                    },
                ]

                setSystems(mockSystems)
                setLoading(false)
            } catch (err) {
                setError("Failed to load logs")
                setLoading(false)
            }
        }

        fetchLogs()
    }, [])

    const toggleSystem = (systemId: string) => {
        setSystems((prev) =>
            prev.map((system) => (system.systemId === systemId ? { ...system, expanded: !system.expanded } : system)),
        )
    }

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString()
    }

    const formatDuration = (seconds: number) => {
        return `${seconds.toFixed(2)}s`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-cyan-400 hover:bg-slate-800">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div className="flex items-center space-x-2">
                            <Eye className="h-8 w-8 text-cyan-400" />
                            <h1 className="text-xl font-bold text-white">Live Logs</h1>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2 bg-transparent border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </Button>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Live{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            Keylogger
                        </span>{" "}
                        Logs
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        Browse all collected logs from users who have run the keylogger. Each system is identified by its unique ID,
                        and logs are organized by timestamp.
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
                        <p className="text-slate-300">Loading logs...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-12">
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
                            <p className="text-red-300">{error}</p>
                        </div>
                    </div>
                )}

                {/* Systems List */}
                {!loading && !error && (
                    <div className="space-y-6">
                        {systems.length === 0 ? (
                            <div className="text-center py-12">
                                <Terminal className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-400">No logs available yet. Be the first to contribute!</p>
                            </div>
                        ) : (
                            systems.map((system) => (
                                <Card
                                    key={system.systemId}
                                    className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300"
                                >
                                    <CardHeader
                                        className="cursor-pointer hover:bg-slate-700/30 transition-colors"
                                        onClick={() => toggleSystem(system.systemId)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    {system.expanded ? (
                                                        <ChevronDown className="h-5 w-5 text-cyan-400" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5 text-cyan-400" />
                                                    )}
                                                    <Monitor className="h-6 w-6 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-white flex items-center space-x-2">
                                                        <span>{system.hostname}</span>
                                                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                                                            {system.os}
                                                        </Badge>
                                                    </CardTitle>
                                                    <CardDescription className="text-slate-400">
                                                        <User className="h-4 w-4 inline mr-1" />
                                                        {system.username} • System ID: {system.systemId}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="border-cyan-400 text-cyan-400">
                                                {system.logs.length} log{system.logs.length !== 1 ? "s" : ""}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    {system.expanded && (
                                        <CardContent className="pt-0">
                                            <div className="space-y-4">
                                                {system.logs.map((log) => (
                                                    <div
                                                        key={log.id}
                                                        className="bg-slate-900/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center space-x-2">
                                                                <Keyboard className="h-4 w-4 text-purple-400" />
                                                                <span className="text-sm text-slate-400">{formatTimestamp(log.logStartTimeUTC)}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-4 text-sm text-slate-400">
                                                                <div className="flex items-center space-x-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{formatDuration(log.logDurationSeconds)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-slate-800/50 rounded p-3 mb-3">
                                                            <p className="text-cyan-300 font-mono text-sm break-all">"{log.loggedContent}"</p>
                                                        </div>

                                                        <div className="text-xs text-slate-500">
                                                            <span className="font-medium">Active Window:</span> {log.systemInfo.ActiveWindow}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Footer CTA */}
                <div className="text-center mt-16 py-12 border-t border-slate-800">
                    <h3 className="text-2xl font-bold text-white mb-4">Want to contribute?</h3>
                    <p className="text-slate-300 mb-6">
                        Download and run the keylogger to add your encrypted logs to this collection.
                    </p>
                    <Link href="/">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-3 text-lg border-0 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
                        >
                            Download Keylogger
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
