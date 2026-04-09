import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SerializerState {
  serializerId: string;
  serializerOptions: Record<string, unknown>;
  setSerializerId: (id: string) => void;
  setSerializerOptions: (opts: Record<string, unknown>) => void;
}

export const useSerializerStore = create<SerializerState>()(
  persist(
    (set) => ({
      serializerId: "csharp-newtonsoft",
      serializerOptions: {},
      setSerializerId: (id) => set({ serializerId: id, serializerOptions: {} }),
      setSerializerOptions: (opts) => set({ serializerOptions: opts }),
    }),
    { name: "jsondig-serializer-store" }
  )
);
