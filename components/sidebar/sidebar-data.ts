import {
  LayoutDashboard,
  BookUser,
  Users,
  FileText,
  ClipboardList,
  Share2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: BookUser },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Encounter Sheets", href: "/templates", icon: FileText },
  { name: "Review Center", href: "/review-center", icon: ClipboardList },
  { name: "Referral List", href: "/referrals", icon: Share2 },
];

export const mockUser = {
  initials: "JD",
  name: "Dr. Jane Doe",
  email: "jane.doe@example.com",
};
