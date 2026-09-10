import type { LucideIcon } from "lucide-react";
import { Pill, FlaskConical, Share2, FileText, Image, Scan } from "lucide-react";

export interface ChartDetailItem {
  label: string;
  meta: string;
}

export interface ChartDetailSection {
  title: string;
  icon: LucideIcon;
  actionLabel: string;
  items: ChartDetailItem[];
  emptyMessage: string;
}

export const CHART_DETAILS_DATA: ChartDetailSection[] = [
  {
    title: "Prescriptions",
    icon: Pill,
    actionLabel: "Add",
    items: [{ label: "Lisinopril 10mg", meta: "Sent 09/08/2026" }],
    emptyMessage: "No prescriptions on file.",
  },
  {
    title: "Lab Orders",
    icon: FlaskConical,
    actionLabel: "Order",
    items: [{ label: "CBC, CMP", meta: "Pending" }],
    emptyMessage: "No lab orders on file.",
  },
  {
    title: "Referrals",
    icon: Share2,
    actionLabel: "Create",
    items: [],
    emptyMessage: "No referrals on file.",
  },
  {
    title: "Documents",
    icon: FileText,
    actionLabel: "Upload",
    items: [],
    emptyMessage: "No documents uploaded.",
  },
  {
    title: "Images",
    icon: Image,
    actionLabel: "Upload",
    items: [],
    emptyMessage: "No images uploaded.",
  },
];

export const ANATOMY_IMAGES_SECTION: ChartDetailSection = {
  title: "Anatomy Images",
  icon: Scan,
  actionLabel: "Upload",
  items: [],
  emptyMessage: "No anatomy images uploaded.",
};
