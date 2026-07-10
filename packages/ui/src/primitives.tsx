import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      className={cn("ui-button", `ui-button--${variant}`, className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "draft" | "reviewed" | "deprecated" | "accent";
}) {
  return (
    <span
      className={cn("ui-badge", `ui-badge--${tone}`, className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn("ui-card", className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      {children}
      {hint ? <span className="ui-field__hint">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="ui-empty" aria-labelledby="empty-state-title">
      <h2 id="empty-state-title">{title}</h2>
      <div>{children}</div>
      {action ? <div className="ui-empty__action">{action}</div> : null}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="ui-page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? (
          <div className="ui-page-header__description">{description}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="ui-page-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
