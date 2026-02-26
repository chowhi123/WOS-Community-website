"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RichEditor from "@/components/RichEditor";
import { safeDecodeURIComponent } from "@/lib/utils";

export default function WritePage() {
    const { slug } = useParams();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Info");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [boardId, setBoardId] = useState(""); // Need to fetch board ID

    // File Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [totalBytes, setTotalBytes] = useState(0);
    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    const MAX_TOTAL_SIZE = 15 * 1024 * 1024; // 15MB
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | File[] } }) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert(`File too large. Max 3MB per image.`);
            return;
        }

        if (totalBytes + file.size > MAX_TOTAL_SIZE) {
            alert(`Total size limit (15MB) exceeded.`);
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();

            // Insert into editor
            const imgTag = `<img src="${data.url}" alt="${file.name}" class="rounded-lg my-4 max-h-[500px]" />`;
            setContent(prev => prev + imgTag);
            setTotalBytes(prev => prev + file.size);

        } catch (error) {
            console.error(error);
            alert("Upload failed.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Editor Ref
    // const textareaRef = useRef<HTMLTextAreaElement>(null);

    // const insertText = (text: string) => {
    //    // Removed for WYSIWYG
    // };

    // Mock categories based on reference image replaced by dynamic state
    const [categories, setCategories] = useState<string[]>([]);

    // Fetch Board Metadata
    useEffect(() => {
        if (!slug) return;
        // Use post/list API because it handles retrieving ANY board by slug (Global or Private)
        fetch(`/api/post/list?boardSlug=${encodeURIComponent(safeDecodeURIComponent(slug as string))}&limit=1`)
            .then(res => res.json())
            .then(data => {
                if (data.board) {
                    setBoardId(data.board.id);
                    if (data.board.availableCategories && data.board.availableCategories.length > 0) {
                        setCategories(data.board.availableCategories);
                        setCategory(data.board.availableCategories[0]);
                    } else {
                        setCategories(["General", "Question"]);
                        setCategory("General");
                    }
                } else {
                    // Board not found or access denied
                    alert("Board not found or you don't have permission.");
                    router.push('/boards');
                }
            })
            .catch(err => console.error(err));
    }, [slug]);

    const handleSubmit = async () => {
        if (!title.trim()) return alert("Please enter a title.");
        if (!content || content === '<p></p>') return alert("Please enter content.");
        if (!boardId) return alert("Loading board info... please wait or refresh.");

        setIsSubmitting(true);

        const res = await fetch("/api/post/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                content,
                boardId,
                category,
                tags: tags.split(",").map(t => t.trim()).filter(Boolean)
            })
        });

        if (res.ok) {
            router.push(`/boards/${slug}`);
        } else {
            alert("Failed to create post.");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen p-4 md:p-8 flex justify-center">
            <div className="w-full max-w-5xl bg-wos-surface border border-white/5 rounded-lg shadow-2xl overflow-hidden flex flex-col">

                {/* Header Section */}
                <div className="p-6 border-b border-white/5 bg-slate-900/50">
                    <h1 className="text-2xl font-bold text-white font-heading mb-6 tracking-wide">
                        {safeDecodeURIComponent(slug || "")} <span className="text-slate-500 text-lg font-normal">/ Write Post</span>
                    </h1>

                    {/* Title Input */}
                    <input
                        type="text"
                        placeholder="Title"
                        className="w-full bg-slate-800/50 border border-slate-700 text-white p-4 rounded text-lg focus:border-ice-500 focus:ring-1 focus:ring-ice-500 transition-all outline-none placeholder:text-slate-600 mb-4"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    {/* Category Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-ice-400 text-sm font-bold mr-2">* Category</span>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm transition-all border ${category === cat
                                    ? "bg-ice-600/20 border-ice-500 text-ice-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                                    : "bg-slate-800/50 border-transparent text-slate-400 hover:text-white hover:bg-slate-700"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 p-2">
                    <RichEditor
                        content={content}
                        onChange={(html) => setContent(html)}
                        placeholder="Share your strategy, ask questions, or discuss alliance matters..."
                        onImageUpload={async (file) => {
                            if (file.size > MAX_FILE_SIZE) {
                                alert(`File too large. Max 3MB per image.`);
                                return null;
                            }
                            if (totalBytes + file.size > MAX_TOTAL_SIZE) {
                                alert(`Total size limit (15MB) exceeded.`);
                                return null;
                            }

                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                                const res = await fetch("/api/upload", { method: "POST", body: formData });
                                if (!res.ok) throw new Error("Upload failed");
                                const data = await res.json();
                                setTotalBytes(prev => prev + file.size);
                                return data.url;
                            } catch (e) {
                                console.error(e);
                                alert("Image upload failed");
                                return null;
                            }
                        }}
                    />
                    <div className="text-right text-xs text-slate-500 mt-1 px-4">
                        {/* Char count approximation */}
                        {content.replace(/<[^>]*>/g, '').length} chars
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-6 border-t border-white/5 bg-slate-900/50 space-y-4">
                    {/* File Upload Stub */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                    />
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                                // Create a synthetic event or call logic directly
                                // For simplicity reuse logic but need to refactor slightly or just pass file
                                const fakeEvent = { target: { files: [file] } } as any;
                                handleUpload(fakeEvent);
                            }
                        }}
                        className="flex items-center gap-4 p-4 bg-slate-800/30 rounded border border-dashed border-slate-700 hover:border-ice-500/50 transition-colors cursor-pointer group"
                    >
                        <div className="bg-ice-600 px-3 py-1.5 rounded text-white text-sm font-bold group-hover:bg-ice-500 transition-colors">
                            {isUploading ? "Uploading..." : "Upload"}
                        </div>
                        <span className="text-slate-500 text-sm group-hover:text-ice-400">
                            Drage images here or click to browse ({formatBytes(totalBytes)} / 15.00 MB)
                        </span>
                    </div>

                    {/* Tags Input */}
                    <input
                        type="text"
                        placeholder="Tags: Separate with comma (,)"
                        className="w-full bg-slate-800/50 border border-slate-700 text-sm text-white p-3 rounded focus:border-ice-500 focus:outline-none placeholder:text-slate-600"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Link href={`/boards/${slug}`} className="px-6 py-2.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                            Cancel
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 rounded bg-ice-600 hover:bg-ice-500 text-white font-bold shadow-[0_4px_14px_0_rgba(2,132,199,0.39)] transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isSubmitting ? "Registering..." : "Register"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
