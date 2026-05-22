import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-16 py-32">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Group 2 Consumer App
        </h1>

        {session?.user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg text-zinc-700 dark:text-zinc-300">
              Signed in as{" "}
              <span className="font-medium">{session.user.email}</span>
            </p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="h-12 rounded-full bg-black px-6 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Sign Out
              </button>
            </form>

            {session.accessToken ? (
              <details className="mt-6 w-full max-w-xl">
                <summary className="cursor-pointer text-sm text-zinc-500">
                  Access token (paste into jwt.io to verify iss + aud)
                </summary>
                <pre className="mt-2 break-all whitespace-pre-wrap rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                  {session.accessToken}
                </pre>
              </details>
            ) : null}
          </div>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("tcss460");
            }}
          >
            <button
              type="submit"
              className="h-12 rounded-full bg-black px-6 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Sign In
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
