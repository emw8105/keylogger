"use client";

import { useState, useEffect, useCallback, JSX, SVGProps } from "react";
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
    Monitor,
    Clock,
    User,
    ChevronDown,
    ChevronRight,
    Keyboard,
    RefreshCw,
} from "lucide-react";

interface SystemSummary {
    systemId: string;
    hostname: string;
    os: string;
    osRelease: string;
    username: string;
}

interface LogEntry {
    LogStartTimeUTC: string;
    LogDurationSeconds: number;
    LoggedContent: string;
    ActiveWindow: string;
    ServerTimestamp: string;
}

interface SystemGroup extends SystemSummary {
    logs: LogEntry[] | null;
    expanded: boolean;
    loadingLogs: boolean;
    logsError: string | null;
}

export default function LogsPage() {
    const [systems, setSystems] = useState<SystemGroup[]>([]);
    const [loadingSystems, setLoadingSystems] = useState(true);
    const [systemsError, setSystemsError] = useState<string | null>(null);

    const goServerBaseUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL;
    const WINDOWS_DOWNLOAD_URL = process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL ? process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL : "";


    const WindowsIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M0 3.79V10h11.23V0H1.8C.81 0 0 .81 0 1.8v1.99zm12.77 0V10H24V1.8C24 .81 23.19 0 22.2 0H12.77v3.79zm-12.77 7.7V20.2C0 21.19.81 22 1.8 22h9.43V11.49H0zm12.77 0V22H22.2c.99 0 1.8-.81 1.8-1.8V11.49H12.77z" />
        </svg>
    );


    const fetchSystemSummaries = useCallback(async () => {
        setLoadingSystems(true);
        setSystemsError(null);

        if (!goServerBaseUrl) {
            setSystemsError(
                "Server URL not configured. Please set NEXT_PUBLIC_SERVER_BASE_URL in your .env.local file."
            );
            setLoadingSystems(false);
            return;
        }

        try {
            const systemsResponse = await fetch(`/api/getSystems`);
            if (!systemsResponse.ok) {
                throw new Error(
                    `Failed to fetch system summaries: ${systemsResponse.statusText}`
                );
            }
            const { systems: systemSummaries }: { systems: SystemSummary[] } =
                await systemsResponse.json();

            // initially systems will have empty logs and loading state, logs will be fetched on expand
            setSystems(
                systemSummaries.map((system) => ({
                    ...system,
                    logs: null,
                    expanded: false,
                    loadingLogs: false,
                    logsError: null,
                }))
            );
        } catch (err: unknown) {
            console.error("Error fetching system summaries:", err);
            if (err instanceof Error) {
                setSystemsError(err.message || "Failed to load systems. Please try again.");
            } else {
                setSystemsError("Failed to load systems. Please try again.");
            }
        } finally {
            setLoadingSystems(false);
        }
    }, [goServerBaseUrl]); // we depend on goServerBaseUrl to ensure it is up-to-date

    const fetchLogsForSystem = useCallback(
        async (systemId: string) => {

            // set loading state and clear errors for the specific system before fetching logs
            // also set the loading state to true to indicate logs are being fetched
            setSystems((prev) =>
                prev.map((s) =>
                    s.systemId === systemId ? { ...s, loadingLogs: true, logsError: null } : s
                )
            );

            // if the server URL isn't configured, prevent fetching logs
            if (!goServerBaseUrl) {
                setSystems((prev) =>
                    prev.map((s) =>
                        s.systemId === systemId
                            ? {
                                ...s,
                                loadingLogs: false,
                                logsError:
                                    "Server URL not configured for log fetching.",
                            }
                            : s
                    )
                );
                return;
            }

            // fetch logs for the specific system
            try {
                const logsResponse = await fetch(
                    `/api/getLogs/${systemId}/logs`
                );
                if (!logsResponse.ok) {
                    throw new Error(
                        `Failed to fetch logs: ${logsResponse.statusText}`
                    );
                }
                const { logs }: { logs: LogEntry[] } = await logsResponse.json();

                // update the system with fetched logs and reset loading state
                setSystems((prev) =>
                    prev.map((s) =>
                        s.systemId === systemId
                            ? { ...s, logs, loadingLogs: false, logsError: null }
                            : s
                    )
                );
            } catch (err: unknown) {
                console.error(`Error fetching logs for ${systemId}:`, err);
                setSystems((prev) =>
                    prev.map((s) =>
                        s.systemId === systemId
                            ? {
                                ...s,
                                logs: [],
                                loadingLogs: false,
                                logsError:
                                    err instanceof Error
                                        ? err.message
                                        : "Failed to load logs for this system.",
                            }
                            : s
                    )
                );
            }
        },
        [goServerBaseUrl]
    );

    useEffect(() => {
        fetchSystemSummaries(); // only fetch the system summaries on initial load
    }, [fetchSystemSummaries]);

    const toggleSystem = (systemId: string) => {
        setSystems((prev) =>
            prev.map((system) => {
                if (system.systemId === systemId) {
                    // if already expanded, just collapse it
                    if (system.expanded) {
                        return { ...system, expanded: false };
                    } else {
                        // if not expanded and logs are not loaded, fetch them
                        if (system.logs === null && !system.loadingLogs) {
                            fetchLogsForSystem(system.systemId);
                        }
                        return { ...system, expanded: true };
                    }
                }
                return system;
            })
        );
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString();
        } catch (e) {
            console.error("Error formatting timestamp:", timestamp, e);
            return "Invalid Date"; // if timestamp is invalid
        }
    };

    const formatDuration = (seconds: number) => {
        if (typeof seconds !== 'number' || isNaN(seconds)) {
            return "N/A"; // if seconds isnt a valid number
        }
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
                        onClick={fetchSystemSummaries}
                        variant="ghost"
                        className="mt-4 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh Systems
                    </Button>
                </div>

                {/* Loading State for Systems */}
                {loadingSystems && (
                    <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
                        <p className="text-slate-300">Loading systems...</p>
                    </div>
                )}

                {/* Error State for Systems */}
                {systemsError && (
                    <div className="text-center py-12">
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
                            <p className="text-red-300">{systemsError}</p>
                        </div>
                    </div>
                )}

                {/* Systems List */}
                {!loadingSystems && !systemsError && (
                    <div className="space-y-6">
                        {systems.length === 0 ? (
                            <div className="text-center py-12">
                                <Terminal className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-400">
                                    No systems available yet. Be the first to contribute!
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
                                                {/* Loading State for Individual Logs */}
                                                {system.loadingLogs ? (
                                                    <div className="text-center py-4 text-slate-400">
                                                        <RefreshCw className="h-5 w-5 text-cyan-400 animate-spin mx-auto mb-2" />
                                                        Loading logs for this system...
                                                    </div>
                                                ) : system.logsError ? (
                                                    <div className="text-center py-4 text-red-400">
                                                        Error loading logs: {system.logsError}
                                                    </div>
                                                ) : system.logs?.length === 0 ? (
                                                    <div className="text-center py-4 text-slate-400">
                                                        No logs found for this system.
                                                    </div>
                                                ) : (
                                                    system.logs?.map((log, index) => (
                                                        <div
                                                            key={index}
                                                            className="bg-slate-900/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center space-x-2">
                                                                    <Keyboard className="h-4 w-4 text-purple-400" />
                                                                    <span className="text-sm text-slate-400">
                                                                        {formatTimestamp(log.ServerTimestamp)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-4 text-sm text-slate-400">
                                                                    <div className="flex items-center space-x-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        <span>
                                                                            {formatDuration(log.LogDurationSeconds)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-800/50 rounded p-3 mb-3">
                                                                <p className="text-cyan-300 font-mono text-sm break-all">
                                                                    &quot;{log.LoggedContent}&quot;
                                                                </p>
                                                            </div>

                                                            <div className="text-xs text-slate-500">
                                                                <span className="font-medium">Active Window:</span>{" "}
                                                                {log.ActiveWindow}
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
                    <Button
                        asChild
                        size="lg"
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-3 text-lg border-0 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
                    >
                        <a
                            href={WINDOWS_DOWNLOAD_URL}
                            download="Keylogger_windows.exe"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <WindowsIcon className="h-5 w-5 mr-2" />
                            <span>Download Keylogger</span>
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}