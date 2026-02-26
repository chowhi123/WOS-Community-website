"use client";

import { useEffect, useState } from "react";

export default function GlobalClock() {
    const [kst, setKst] = useState("");
    const [utc, setUtc] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const tz = process.env.NEXT_PUBLIC_TZ || "Asia/Seoul";

            // Configurable TZ
            const localTime = new Intl.DateTimeFormat("en-US", {
                timeZone: tz,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }).format(now);

            // UTC
            const utcTime = new Intl.DateTimeFormat("en-US", {
                timeZone: "UTC",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }).format(now);

            // Get abbreviated TZ name (simple) or just use the Env var text if short
            // "Asia/Seoul" -> "Seoul" or just use hardcoded "KST" if we specifically want KST?
            // User said: "Asia/Seoul을 기본으로 세팅해두고 ... 다른 타임존으로 바꿔도 좋을거같아"
            // So we should try to display a generic name or the specific TZ code.
            // User requested to show City Name (e.g. "Seoul" from "Asia/Seoul")
            const city = tz.includes("/") ? tz.split("/").pop()?.replace(/_/g, " ") || tz : tz;
            const tzName = city;

            setKst(`${localTime}`); // We keep variable name kst but logic is generic
            setUtc(utcTime);
            setTzLabel(tzName);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const [tzLabel, setTzLabel] = useState("LOC");

    if (!kst) return null; // Prevent hydration mismatch

    return (
        <div className="flex gap-4 text-xs font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700 text-slate-400">
            <div>
                <span className="font-bold text-sky-400">{tzLabel}</span> {kst}
            </div>
            <div className="border-l border-slate-700 pl-4">
                <span className="font-bold text-violet-400">UTC</span> {utc}
            </div>
        </div>
    );
}
