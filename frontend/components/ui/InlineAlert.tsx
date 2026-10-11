import type { ReactNode } from "react";
import { AlertIcon } from "./Icons";

/**
 * A one-line error under a field or a row. Same red and the same icon as Notice, just without the box.
 * Pass role="alert" when it appears after an action so it is announced.
 */
export function InlineAlert({
  children,
  id,
  role,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  role?: "alert";
  className?: string;
}) {
  return (
    <p
      id={id}
      role={role}
      className={`enter-fade flex items-start gap-1.5 text-[13.5px] font-medium leading-snug text-danger ${className}`}
    >
      <AlertIcon size={16} className="mt-px shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
