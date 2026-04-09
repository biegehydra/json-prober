import type { Serializer } from "./types";

const serializers = new Map<string, Serializer>();

export function registerSerializer(serializer: Serializer): void {
  serializers.set(serializer.definition.id, serializer);
}

export function getSerializer(id: string): Serializer | undefined {
  return serializers.get(id);
}

export function getAllSerializers(): Serializer[] {
  return Array.from(serializers.values());
}

export function getDefaultOptions(id: string): Record<string, unknown> {
  const s = serializers.get(id);
  if (!s) return {};
  const opts: Record<string, unknown> = {};
  for (const opt of s.definition.options) {
    opts[opt.id] = opt.default;
  }
  return opts;
}
