import type { IconSvgElement } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  ContactBookIcon,
  UserGroupIcon,
  File01Icon,
  ClipboardIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons";

export interface NavItem {
  name: string;
  href: string;
  icon: IconSvgElement;
}

export const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: DashboardSquare01Icon },
  { name: "Appointments", href: "/appointments", icon: ContactBookIcon },
  { name: "Patients", href: "/patients", icon: UserGroupIcon },
  { name: "Encounter Sheets", href: "/templates", icon: File01Icon },
  { name: "Review Center", href: "/review-center", icon: ClipboardIcon },
  { name: "Referral List", href: "/referrals", icon: Share01Icon },
];

export const mockUser = {
  initials: "JD",
  name: "Dr. Jane Doe",
  email: "jane.doe@example.com",
};
