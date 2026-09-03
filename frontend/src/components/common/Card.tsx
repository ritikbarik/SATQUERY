import type { PropsWithChildren, ReactNode } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
  title?: string;
  icon?: ReactNode;
}

export const Card = ({ children, className = "", title, icon }: CardProps) => (
  <section className={`glass-card ${className}`}>
    {title ? (
      <div className="card-title">
        {icon}
        <span>{title}</span>
      </div>
    ) : null}
    {children}
  </section>
);
