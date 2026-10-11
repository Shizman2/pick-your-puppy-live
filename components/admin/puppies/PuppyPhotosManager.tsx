"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { uploadPuppyPhoto, removePuppyPhoto, reorderPuppyPhotos } from "../../../app/admin/puppies/actions";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB - leaves headroom under the 10MB server limit

function SortablePhoto({
  url,
  index,
  alt,
  disabled,
  onRemove,
}: {
  url: string;
  index: number;
  alt: string;
  disabled: boolean;
  onRemove: (url: string) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={`puppy-photo-thumb${isDragging ? " is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} draggable={false} />
      {index === 0 && <span className="puppy-photo-cover">Cover</span>}
      {/* Drag handle only (not the whole tile) so the page still scrolls
          normally when a finger lands on a photo. */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="puppy-photo-handle"
        aria-label={`Drag to reorder photo ${index + 1}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <button
        type="button"
        className="puppy-photo-remove"
        aria-label={`Remove photo ${index + 1}`}
        disabled={disabled}
        onClick={() => onRemove(url)}
      >
        ×
      </button>
    </div>
  );
}

export default function PuppyPhotosManager({
  puppyId,
  initialUrls,
  alt,
}: {
  puppyId: string;
  initialUrls: string[];
  alt: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialUrls);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const busy = progress !== null || savingOrder;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0 || busy) return;

    setNotice(null);
    const failures: string[] = [];
    setProgress({ done: 0, total: files.length });

    // One at a time: each upload appends to photo_urls with a read-then-write
    // on the server, so parallel uploads could overwrite each other.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_BYTES) {
        failures.push(`${file.name}: ${(file.size / 1024 / 1024).toFixed(1)}MB - please use one under 8MB.`);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const result = await uploadPuppyPhoto(puppyId, formData);
          if (result.success) {
            const url = result.url;
            setPhotoUrls((prev) => [...prev, url]);
          } else {
            failures.push(`${file.name}: ${result.error}`);
          }
        } catch (err) {
          failures.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
        }
      }
      setProgress({ done: i + 1, total: files.length });
    }

    setProgress(null);
    setErrors(failures);
    const uploaded = files.length - failures.length;
    if (uploaded > 0) setNotice(`${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded.`);
    router.refresh();
  }

  async function handleRemove(url: string) {
    if (busy) return;
    if (!confirm("Remove this photo?")) return;
    setNotice(null);
    setErrors([]);
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
    const result = await removePuppyPhoto(puppyId, url);
    if (!result.success) {
      setPhotoUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
      setErrors([result.error]);
    }
    router.refresh();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const before = photoUrls;
    const next = arrayMove(before, before.indexOf(String(active.id)), before.indexOf(String(over.id)));
    setPhotoUrls(next);
    setNotice(null);
    setErrors([]);
    setSavingOrder(true);
    const result = await reorderPuppyPhotos(puppyId, next);
    setSavingOrder(false);
    if (!result.success) {
      setPhotoUrls(before);
      setErrors([result.error]);
      return;
    }
    setNotice("Photo order saved.");
    router.refresh();
  }

  return (
    <div className="admin-field">
      <label className="admin-field__label">Puppy Photos</label>
      {photoUrls.length > 1 && (
        <p className="admin-hint" style={{ marginTop: 0 }}>
          Drag ⠿ to reorder. The first photo is the cover shown on cards.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={photoUrls} strategy={rectSortingStrategy}>
          <div className="puppy-photo-grid">
            {photoUrls.map((url, i) => (
              <SortablePhoto key={url} url={url} index={i} alt={alt} disabled={busy} onRemove={handleRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <label className={`admin-btn puppy-photo-upload-btn${busy ? " is-disabled" : ""}`}>
        {progress ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}...` : "Upload Photos"}
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} disabled={busy} hidden />
      </label>
      {savingOrder && <p className="admin-hint">Saving order...</p>}
      {notice && !busy && <p className="admin-hint">{notice}</p>}
      {errors.length > 0 && (
        <div className="inquire-error" role="alert" style={{ marginTop: 8 }}>
          {errors.length > 1 && <strong>{errors.length} photos didn&apos;t upload:</strong>}
          {errors.map((msg) => (
            <div key={msg}>{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}
