export type SeverityTone = {
  chip: string;
  bar: string;
  text: string;
};

export function severityTone(severity: number): SeverityTone {
  if (severity <= 3) {
    return {
      chip: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-500",
      text: "text-emerald-600",
    };
  }
  if (severity <= 6) {
    return { chip: "bg-amber-100 text-amber-700", bar: "bg-amber-500", text: "text-amber-600" };
  }
  if (severity <= 8) {
    return { chip: "bg-orange-100 text-orange-700", bar: "bg-orange-500", text: "text-orange-600" };
  }
  return { chip: "bg-red-100 text-red-700", bar: "bg-red-500", text: "text-red-600" };
}
