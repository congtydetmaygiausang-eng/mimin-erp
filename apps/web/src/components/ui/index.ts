// ============ BARREL EXPORT cho components/ui (Đợt 2) ============
// Cho phép import gọn: `import { ConfirmDialog, EmptyState } from "@/components/ui"`

export { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";
export { PromptModal, type PromptModalProps } from "./PromptModal";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { Skeleton, SkeletonCard, SkeletonTable, type SkeletonProps } from "./Skeleton";
export { MobileCard, MobileCardList, type MobileCardProps, type MobileCardField } from "./MobileCardView";
export { DateDisplay, formatDateVN, type DateDisplayProps } from "./DateDisplay";
export { RoleBadge, type RoleBadgeProps } from "./RoleBadge";
export { ScopeBadge, type ScopeBadgeProps } from "./ScopeBadge";
export { CrudModal, type FieldDef } from "./CrudModal";
export { ImageUploader, type UploadedFile } from "./ImageUploader";

// Re-export formatVND helpers từ real-data (dùng nhiều nơi)
export { formatVND, formatVNDShort } from "@/lib/data/real-data";
