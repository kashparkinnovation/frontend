"use client";
import BlogEditor from "@/components/admin/BlogEditor";
import { useParams } from "next/navigation";

export default function EditPostPage() {
  const params = useParams();
  const idStr = params?.id;
  // If id is explicitly 'new', we shouldn't pass it as numeric, but this route is `[id]` so 'new' won't hit here due to precedence unless 'new/page.tsx' is missing.
  // However we have 'new/page.tsx' safely defined.
  return <BlogEditor postId={Number(idStr)} />;
}
