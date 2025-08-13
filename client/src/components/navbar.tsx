import { Button } from "@/components/ui/button"
import { Terminal, Eye, Github, ExternalLink } from "lucide-react"
import Link from "next/link"

interface NavbarProps {
    currentPage?: "home" | "logs"
}

export default function Navbar({ currentPage = "home" }: NavbarProps) {
    return (
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <Terminal className="h-8 w-8 text-cyan-400" />
                    <h1 className="text-xl font-bold text-white">Remote Keylogger</h1>
                </Link>

                <nav className="flex items-center space-x-6">
                    <Link href="/#about" className="text-slate-300 hover:text-cyan-400 transition-colors">
                        About
                    </Link>

                    <Link
                        href="https://github.com/emw8105/keylogger"
                        className="flex items-center space-x-1 text-slate-300 hover:text-cyan-400 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Github className="h-4 w-4" />
                        <span>Source</span>
                        <ExternalLink className="h-3 w-3" />
                    </Link>

                    {currentPage === "home" ? (
                        <Link href="/logs">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-2 bg-transparent border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all duration-300 hover:scale-105"
                            >
                                <Eye className="h-4 w-4" />
                                <span>View Logs</span>
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-2 bg-transparent border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-slate-900 transition-all duration-300 hover:scale-105"
                            >
                                <Terminal className="h-4 w-4" />
                                <span>Home</span>
                            </Button>
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    )
}
