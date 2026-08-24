export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
        <p className="text-gray-600">
          We have sent you a verification link. In development mode, check the terminal console for the link.
        </p>
        <a href="/login" className="text-sm text-blue-600 hover:underline">
          Back to Login
        </a>
      </div>
    </div>
  );
}