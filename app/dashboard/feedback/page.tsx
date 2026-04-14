"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { CreatePostDialog } from "@/components/feedback/create-post-dialog";

export default function FeedbackPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1c0a0c]">Feedback Board</h2>
          <p className="text-sm text-[#1c0a0c]/60">
            Manage feature requests, bugs, and user feedback
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      <FeedbackList />
      <CreatePostDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
