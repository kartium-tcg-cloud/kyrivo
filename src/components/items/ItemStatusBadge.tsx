// Badge statut réutilisable — utilisé dans le tableau achats, page détail, futur module ventes

import { ItemStatus, ITEM_STATUS_CONFIG } from "@/types/item";

interface ItemStatusBadgeProps {
  status: ItemStatus;
  size?: "sm" | "md";
}

export default function ItemStatusBadge({
  status,
  size = "sm",
}: ItemStatusBadgeProps) {
  const config = ITEM_STATUS_CONFIG[status];
  const isLive = status === "in_stock";

  const sizeClasses =
    size === "md"
      ? "px-3 py-1 text-xs"
      : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full border
        font-semibold uppercase tracking-wide
        ${sizeClasses}
        ${config.bg}
        ${config.text}
        ${config.border}
      `}
    >
      <span
        className={`
          inline-block h-1.5 w-1.5 rounded-full
          ${config.dot}
          ${isLive ? "animate-pulse" : ""}
        `}
      />
      {config.label}
    </span>
  );
}