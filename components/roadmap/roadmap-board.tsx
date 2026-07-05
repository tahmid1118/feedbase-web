"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, X, Calendar, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  roadmapApi,
  postsApi,
  extractRows,
  type RoadmapColumn,
  type RoadmapItem,
  type Post,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus";

export function RoadmapBoard() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [columns, setColumns] = useState<RoadmapColumn[]>([]);
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [columnDialog, setColumnDialog] = useState<{
    open: boolean;
    editing?: RoadmapColumn;
  }>({ open: false });
  const [columnName, setColumnName] = useState("");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemPostId, setItemPostId] = useState("");
  const [itemColumnId, setItemColumnId] = useState("");
  const [itemDate, setItemDate] = useState("");
  const [busy, setBusy] = useState(false);

  // Kanban drag-and-drop (dnd-kit). The active item is rendered in a floating
  // DragOverlay so the whole card follows the cursor while dragging.
  const [activeItem, setActiveItem] = useState<RoadmapItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [columnsRes, itemsRes, postsRes] = await Promise.all([
        roadmapApi.getColumns(token),
        roadmapApi.getItems(token),
        postsApi.list(
          { itemsPerPage: 200, currentPageNumber: 0, sortOrder: "desc", filterBy: "" },
          undefined,
          token
        ),
      ]);
      setColumns(extractRows<RoadmapColumn>(columnsRes.data, "columns"));
      setItems(extractRows<RoadmapItem>(itemsRes.data, "items"));
      setPosts(extractRows<Post>(postsRes.data, "posts"));
    } catch (error) {
      console.error("Failed to load roadmap:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Reflect status/roadmap changes made elsewhere when returning to this page.
  useRefetchOnFocus(load);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.sort_order - b.sort_order),
    [columns]
  );

  const itemsByColumn = useCallback(
    (columnId: number) =>
      items
        .filter((i) => i.roadmap_column_id === columnId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items]
  );

  const availablePosts = useMemo(() => {
    const usedPostIds = new Set(items.map((i) => i.post_id));
    return posts.filter((p) => !usedPostIds.has(p.id));
  }, [items, posts]);

  const postTitle = (postId: number) =>
    posts.find((p) => p.id === postId)?.title ?? `Post #${postId}`;

  // --- Column actions ---
  const openEditColumn = (column: RoadmapColumn) => {
    setColumnName(column.name);
    setColumnDialog({ open: true, editing: column });
  };

  const saveColumn = async () => {
    if (!token || !columnName.trim() || !columnDialog.editing) return;
    setBusy(true);
    try {
      await roadmapApi.updateColumn(
        columnDialog.editing.id,
        { name: columnName.trim() },
        token
      );
      toast.success("Column updated");
      setColumnDialog({ open: false });
      await load();
    } catch {
      toast.error("Failed to save column");
    } finally {
      setBusy(false);
    }
  };

  // --- Item actions ---
  const openAddItem = (columnId?: number) => {
    setItemPostId("");
    setItemColumnId(columnId ? String(columnId) : sortedColumns[0] ? String(sortedColumns[0].id) : "");
    setItemDate("");
    setItemDialogOpen(true);
  };

  const saveItem = async () => {
    if (!token || !itemPostId || !itemColumnId) return;
    setBusy(true);
    try {
      const columnId = Number(itemColumnId);
      await roadmapApi.addItem(
        {
          postId: Number(itemPostId),
          roadmapColumnId: columnId,
          sortOrder: itemsByColumn(columnId).length + 1,
          ...(itemDate ? { targetReleaseDate: itemDate } : {}),
        },
        token
      );
      toast.success("Added to roadmap");
      setItemDialogOpen(false);
      await load();
    } catch {
      toast.error("Failed to add item");
    } finally {
      setBusy(false);
    }
  };

  const moveItem = async (item: RoadmapItem, columnId: number) => {
    if (!token || item.roadmap_column_id === columnId) return;
    try {
      await roadmapApi.updateItem(
        item.id,
        {
          roadmapColumnId: columnId,
          sortOrder: itemsByColumn(columnId).length + 1,
        },
        token
      );
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, roadmap_column_id: columnId } : i
        )
      );
    } catch {
      toast.error("Failed to move item");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem((event.active.data.current?.item as RoadmapItem) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const item = event.active.data.current?.item as RoadmapItem | undefined;
    const columnId = event.over?.data.current?.columnId as number | undefined;
    setActiveItem(null);
    if (item && columnId != null) moveItem(item, columnId);
  };

  const removeItem = async (id: number) => {
    if (!token) return;
    try {
      await roadmapApi.removeItem(id, token);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Removed from roadmap");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
        Loading roadmap...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={() => openAddItem()}
          disabled={sortedColumns.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add to Roadmap
        </Button>
      </div>

      {sortedColumns.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-[#1c0a0c]/60">
            No roadmap columns yet.
          </p>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveItem(null)}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sortedColumns.map((column) => {
              const columnItems = itemsByColumn(column.id);
              return (
                <DroppableColumn key={column.id} columnId={column.id}>
                  {(isOver) => (
                    <div
                      className={`h-full space-y-3 rounded-xl p-1 transition-colors ${
                        isOver
                          ? "bg-[#c74959]/5 ring-2 ring-inset ring-[#c74959]/40"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between rounded-lg bg-[#c74959]/10 p-3">
                        <div>
                          <h3 className="font-semibold text-[#1c0a0c]">
                            {column.name}
                          </h3>
                          <p className="text-xs text-[#1c0a0c]/60">
                            {columnItems.length} items
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditColumn(column)}
                            className="rounded p-1 text-[#1c0a0c]/60 hover:bg-white hover:text-[#c74959]"
                            aria-label="Edit column"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="min-h-[60px] space-y-2">
                        {columnItems.map((item) => (
                          <DraggableItem
                            key={item.id}
                            item={item}
                            title={item.title || postTitle(item.post_id)}
                            onRemove={() => removeItem(item.id)}
                          />
                        ))}

                        <button
                          type="button"
                          onClick={() => openAddItem(column.id)}
                          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[#e399a3]/50 py-2 text-xs text-[#1c0a0c]/60 hover:border-[#c74959] hover:text-[#c74959]"
                        >
                          <Plus className="h-3 w-3" />
                          Add item
                        </button>
                      </div>
                    </div>
                  )}
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeItem ? (
              <ItemCard
                item={activeItem}
                title={activeItem.title || postTitle(activeItem.post_id)}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Column dialog */}
      <Dialog
        open={columnDialog.open}
        onOpenChange={(open) => setColumnDialog({ open })}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <DialogDescription>
              Rename this roadmap column.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="column-name">Column name</Label>
            <Input
              id="column-name"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="e.g. In Progress"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setColumnDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              onClick={saveColumn}
              disabled={busy || !columnName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add item dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Add to Roadmap</DialogTitle>
            <DialogDescription>
              Place a feedback post onto a roadmap column.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Post</Label>
              <Select value={itemPostId} onValueChange={setItemPostId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a post" />
                </SelectTrigger>
                <SelectContent>
                  {availablePosts.length === 0 ? (
                    <div className="px-2 py-3 text-center text-sm text-[#1c0a0c]/50">
                      All posts are already on the roadmap.
                    </div>
                  ) : (
                    availablePosts.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Column</Label>
              <Select value={itemColumnId} onValueChange={setItemColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {sortedColumns.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-date">Target release date (optional)</Label>
              <Input
                id="target-date"
                type="date"
                value={itemDate}
                onChange={(e) => setItemDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              onClick={saveItem}
              disabled={busy || !itemPostId || !itemColumnId}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** The visual card. Shared by the in-column item and the floating DragOverlay. */
function ItemCard({
  item,
  title,
  onRemove,
  dragging,
  overlay,
}: {
  item: RoadmapItem;
  title: string;
  onRemove?: () => void;
  dragging?: boolean;
  overlay?: boolean;
}) {
  return (
    <Card
      className={`bg-white p-3 ${
        overlay
          ? "cursor-grabbing shadow-xl ring-2 ring-[#c74959]/30"
          : "cursor-grab active:cursor-grabbing"
      } ${dragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1c0a0c]/30" />
          <p className="text-sm font-medium text-[#1c0a0c]">{title}</p>
        </div>
        {onRemove && (
          <button
            type="button"
            // Stop the drag sensor from claiming the pointer so the click lands.
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="text-[#1c0a0c]/40 hover:text-red-600"
            aria-label="Remove item"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {/* Always reserve the row so dated and date-less cards stay the same height. */}
      <div className="mt-1 flex h-4 items-center gap-1 pl-5 text-xs text-[#1c0a0c]/60">
        {item.target_release_date && (
          <>
            <Calendar className="h-3 w-3" />
            {new Date(item.target_release_date).toLocaleDateString()}
          </>
        )}
      </div>
    </Card>
  );
}

function DraggableItem({
  item,
  title,
  onRemove,
}: {
  item: RoadmapItem;
  title: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { item },
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="touch-none">
      <ItemCard
        item={item}
        title={title}
        onRemove={onRemove}
        dragging={isDragging}
      />
    </div>
  );
}

function DroppableColumn({
  columnId,
  children,
}: {
  columnId: number;
  children: (isOver: boolean) => ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${columnId}`,
    data: { columnId },
  });

  return (
    <div ref={setNodeRef} className="h-full">
      {children(isOver)}
    </div>
  );
}
