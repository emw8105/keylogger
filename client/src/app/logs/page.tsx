"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
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
} from "lucide-react";
import Link from "next/link";

interface SystemSummary {
    systemId: string;
    hostname: string;
    os: string;
    osRelease: string;
    username: string;
}

interface LogEntry {
    logStartTimeUTC: string;
    logDurationSeconds: number;
    loggedContent: string;
    activeWindow: string;
    serverTimestamp: string;
}

interface SystemGroup extends SystemSummary {
    logs: LogEntry[];
    expanded: boolean;
}

export default function LogsPage() {
    const [systems, setSystems] = useState<SystemGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAllSystemData = async () => {
        setLoading(true);
        setError(null);

        const goServerBaseUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL

        try {
            // 1. Fetch all system summaries
            const systemsResponse = await fetch(`${goServerBaseUrl}/api/getSystems`);
            if (!systemsResponse.ok) {
                throw new Error(
                    `Failed to fetch system summaries: ${systemsResponse.statusText}`
                );
            }
            const { systems: systemSummaries }: { systems: SystemSummary[] } =
                await systemsResponse.json();

            // 2. For each system, fetch its logs concurrently
            const systemGroupsPromises = systemSummaries.map(async (system) => {
                const logsResponse = await fetch(`${goServerBaseUrl}/api/getLogs/${system.systemId}/logs`);
                if (!logsResponse.ok) {
                    console.warn(`Failed to fetch logs for system ${system.systemId}: ${logsResponse.statusText}`);
                    return { ...system, logs: [], expanded: false }; // Return system with empty logs on error
                }
                const { logs }: { logs: LogEntry[] } = await logsResponse.json();

                return { ...system, logs, expanded: false };
            });

            const fetchedSystemGroups = await Promise.all(systemGroupsPromises);
            setSystems(fetchedSystemGroups);
        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(err.message || "Failed to load logs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllSystemData();
    }, []); // Run once on component mount

    const toggleSystem = (systemId: string) => {
        setSystems((prev) =>
            prev.map((system) =>
                system.systemId === systemId
                    ? { ...system, expanded: !system.expanded }
                    : system
            )
        );
    };

    const formatTimestamp = (timestamp: string) => {
        // Attempt to parse and format. If invalid, return original string.
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return timestamp;
        }
    };

    const formatDuration = (seconds: number) => {
        return `${seconds.toFixed(2)}s`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Navbar currentPage="logs" />

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
                        Browse all collected logs from users who have run the keylogger. Each
                        system is identified by its unique ID, and logs are organized by
                        timestamp.
                    </p>
                    <Button
                        onClick={fetchAllSystemData}
                        variant="ghost"
                        className="mt-4 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh Logs
                    </Button>
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
                                <p className="text-slate-400">
                                    No logs available yet. Be the first to contribute!
                                </p>
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
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-slate-700 text-slate-300"
                                                        >
                                                            {system.os}
                                                        </Badge>
                                                    </CardTitle>
                                                    <CardDescription className="text-slate-400">
                                                        <User className="h-4 w-4 inline mr-1" />
                                                        {system.username} • System ID: {system.systemId}
                                                        <br />
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {system.expanded && (
                                        <CardContent className="pt-0">
                                            <div className="space-y-4">
                                                {system.logs.length === 0 ? (
                                                    <div className="text-center py-4 text-slate-400">No logs found for this system.</div>
                                                ) : (
                                                    system.logs.map((log, index) => (
                                                        <div
                                                            key={index} // Use index as key if logs don't have unique IDs
                                                            className="bg-slate-900/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center space-x-2">
                                                                    <Keyboard className="h-4 w-4 text-purple-400" />
                                                                    <span className="text-sm text-slate-400">
                                                                        {formatTimestamp(log.serverTimestamp)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-4 text-sm text-slate-400">
                                                                    <div className="flex items-center space-x-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        <span>{formatDuration(log.logDurationSeconds)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-800/50 rounded p-3 mb-3">
                                                                <p className="text-cyan-300 font-mono text-sm break-all">
                                                                    "{log.loggedContent}"
                                                                </p>
                                                            </div>

                                                            <div className="text-xs text-slate-500">
                                                                <span className="font-medium">Active Window:</span>{" "}
                                                                {log.activeWindow}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
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
                    <h3 className="text-2xl font-bold text-white mb-4">
                        Want to contribute?
                    </h3>
                    <p className="text-slate-300 mb-6">
                        Download and run the keylogger to add your encrypted logs to this
                        collection.
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
    );
}
