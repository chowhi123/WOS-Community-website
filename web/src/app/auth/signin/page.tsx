"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignIn() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-slate-800 p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">WOS Community</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Sign in to access your alliance features
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="flex w-full justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-colors"
                    >
                        Continue with Google
                    </button>
                </div>
            </div>
        </div>
    );
}
