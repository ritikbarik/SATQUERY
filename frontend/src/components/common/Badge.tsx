import type { PropsWithChildren } from "react";

interface BadgeProps extends PropsWithChildren {
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Badge = ({ children, active = false, onClick, className = "" }: BadgeProps) => (
  <span
    className={`badge ${active ? "badge-active" : ""} ${className}`}
    onClick={onClick}
  >
    {children}
  </span>
);
