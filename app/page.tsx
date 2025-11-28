export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Lacks Expense Management
        </h1>
        <p className="text-xl text-gray-600">
          Bismillah - Let's build this! 🚀
        </p>
        <div className="mt-8 text-left max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Next Steps:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Set up environment variables (.env.local)</li>
            <li>Configure Office 365 Entra SSO</li>
            <li>Test Supabase connection</li>
            <li>Build authentication flow</li>
            <li>Create user dashboard</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
