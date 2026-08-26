import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LikedSamplesState {
  likedIds: string[];
  toggleLike: (id: string) => void;
  isLiked: (id: string) => boolean;
}

export const useLikedSamplesStore = create<LikedSamplesState>()(
  persist(
    (set, get) => ({
      likedIds: [],
      toggleLike: (id) =>
        set((state) => ({
          likedIds: state.likedIds.includes(id)
            ? state.likedIds.filter((likedId) => likedId !== id)
            : [...state.likedIds, id],
        })),
      isLiked: (id) => get().likedIds.includes(id),
    }),
    {
      name: "mimin-liked-samples",
    }
  )
);
