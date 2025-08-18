import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, Terminal, Code, Database, Github, ExternalLink } from "lucide-react"
import Navbar from "@/components/navbar"
import Link from "next/link"
import { JSX, SVGProps } from "react"

export default function HomePage() {

  const WINDOWS_DOWNLOAD_URL = process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL ? process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL : "";
  console.log(WINDOWS_DOWNLOAD_URL)
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar currentPage="home" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Remote{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Keylogger
            </span>{" "}
            System
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            A secure remote logging system with end-to-end encryption. Features RSA key exchange, AES-256 encryption,
            and real-time data collection from multiple clients.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-3 text-lg flex items-center space-x-2 border-0 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              <a
                href={WINDOWS_DOWNLOAD_URL}
                download="Keylogger_windows.exe"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WindowsIcon className="h-5 w-5 ml-2" />
                <span>Download for Windows</span>
              </a>
            </Button>
            <Link href="/logs">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg flex items-center space-x-2 bg-transparent border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/25"
              >
                <Eye className="h-5 w-5" />
                <span>View Live Logs</span>
              </Button>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-amber-200 text-sm">
              <strong>Windows Only:</strong> The executable is compiled for Windows. Mac/Linux users can clone the
              <Link
                href="https://github.com/emw8105/keylogger"
                className="text-cyan-400 hover:text-cyan-300 mx-1 underline"
              >
                GitHub repository
              </Link>
              and build from source.
            </p>
          </div>
        </div>
      </section>

      {/* Usage Instructions */}
      <section className="bg-slate-800/20 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-white mb-12">Usage Instructions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/10">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Download className="h-6 w-6 text-cyan-400" />
                    <CardTitle className="text-white">Running the Logger</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300 space-y-3">
                    <p>1. Double-click the downloaded executable</p>
                    <p>2. The logger runs invisibly in the background (no popup window)</p>
                    <p>3. Check Task Manager to confirm the process is running</p>
                    <p>4. Your keystrokes are encrypted and sent to the server in batches</p>
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-6 w-6 text-purple-400" />
                    <CardTitle className="text-white">Stopping the Logger</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300 space-y-3">
                    <p>Option 1: Type "keylogger kill" anywhere in your system</p>
                    <p>Option 2: End the process via Task Manager</p>
                    <p>Option 3: Restart your computer</p>
                    <p>Verify termination by checking Task Manager</p>
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">System Architecture</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/10">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Terminal className="h-6 w-6 text-cyan-400" />
                  <CardTitle className="text-white">Python Client</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  Lightweight keylogger with batch sending, AES-256 encryption, and secure handshake protocol. Captures
                  system-wide keypresses and sends encrypted logs to the server.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Code className="h-6 w-6 text-purple-400" />
                  <CardTitle className="text-white">Go Server</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  High-performance server with RSA key management, secure decryption pipeline, and organized log
                  storage. Handles multiple clients with end-to-end encryption.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/10">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Database className="h-6 w-6 text-green-400" />
                  <CardTitle className="text-white">Firebase Storage</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  Real-time database integration for persistent log storage and live viewing. Organized by system ID and
                  timestamp for easy browsing and analysis.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="bg-slate-800/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Security Features</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Encryption</h3>
                <ul className="space-y-2 text-slate-300 text-left">
                  <li>• RSA 2048-bit key exchange (OAEP SHA256)</li>
                  <li>• AES-256 symmetric encryption (GCM mode)</li>
                  <li>• Authentication tags for integrity verification</li>
                  <li>• Per-session key generation</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-400 mb-4">Architecture</h3>
                <ul className="space-y-2 text-slate-300 text-left">
                  <li>• Secure handshake protocol</li>
                  <li>• Batch transmission with inactivity timeout</li>
                  <li>• System-wide input monitoring</li>
                  <li>• Organized log file structure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
          <div className="text-slate-300 space-y-6">
            <p className="text-lg">
              This remote keylogger system demonstrates secure client-server communication with end-to-end encryption.
              The Python client captures keystrokes and sends encrypted batches to the Go server, which decrypts and
              stores the data.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mt-12 text-left">
              <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Client Process</h3>
                <ol className="space-y-2 text-slate-300 list-decimal list-inside">
                  <li>Fetches server's RSA public key via handshake</li>
                  <li>Generates AES-256 session key</li>
                  <li>Captures system keystrokes continuously</li>
                  <li>Encrypts and batches logs after inactivity</li>
                  <li>Sends encrypted payload to server</li>
                </ol>
              </div>

              <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Server Process</h3>
                <ol className="space-y-2 text-slate-300 list-decimal list-inside">
                  <li>Generates RSA key pair on startup</li>
                  <li>Provides public key via /handshake endpoint</li>
                  <li>Receives encrypted logs via /log endpoint</li>
                  <li>Decrypts AES key using RSA private key</li>
                  <li>Decrypts and stores logs by system ID</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Try It Out</h2>
          <p className="text-lg text-slate-300 mb-8">
            Browse the live logs to see what data gets collected, then download and run the tool to contribute your own
            encrypted logs to the system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/logs">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 text-lg bg-transparent border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/25"
              >
                Browse Live Logs
              </Button>
            </Link>
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
                <span>Download & Run</span>
              </a>
            </Button>
          </div>

          <div className="flex justify-center">
            <Link
              href="https://github.com/emw8105/keylogger"
              className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Github className="h-5 w-5" />
              <span>View Source Code</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400">
            Remote keylogger system with end-to-end encryption.
            <span className="block mt-2">
              Server running at <code className="text-cyan-400">keylogger.doypid.com</code>
            </span>
          </p>
        </div>
      </footer>
    </div>
  )
}
