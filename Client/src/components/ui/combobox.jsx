import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Search, Plus, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Shared dropdown content
// ---------------------------------------------------------------------------

function DropdownContent({ items, query, onQueryChange, onSelect, getLabel, renderItem, loading, emptyText, inputPlaceholder }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={inputPlaceholder ?? "กรอกเพื่อกรอง..."}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoFocus
        />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {loading && items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText ?? "ไม่พบรายการ"}</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors"
              onClick={() => onSelect(item)}
            >
              {renderItem ? renderItem(item) : <span className="truncate">{getLabel(item)}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SelectCombobox — single-item selector
// Shows selected label on trigger; opens full filterable list.
// ---------------------------------------------------------------------------

export function SelectCombobox({
  items = [],
  value = null,
  onSelect,
  placeholder = "เลือก...",
  getKey = (item) => item.id,
  getLabel,
  renderItem,
  filterFn,
  loading = false,
  disabled = false,
  className,
  inputPlaceholder,
  emptyText,
  container,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedItem = value != null
    ? items.find((i) => String(getKey(i)) === String(value))
    : null;

  const filtered = query.trim()
    ? items.filter((item) =>
        filterFn
          ? filterFn(item, query)
          : (getLabel(item) ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedItem && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selectedItem ? getLabel(selectedItem) : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
        container={container}
      >
        <DropdownContent
          items={filtered}
          query={query}
          onQueryChange={setQuery}
          onSelect={(item) => { onSelect(item); setOpen(false); setQuery(""); }}
          getLabel={getLabel}
          renderItem={renderItem}
          loading={loading && items.length === 0}
          emptyText={emptyText}
          inputPlaceholder={inputPlaceholder}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// AddCombobox — add-to-list selector
// Trigger is always a "+ เพิ่ม" button; shows filtered available items.
// Pass pre-filtered items (i.e. exclude already-added ones before passing in).
// ---------------------------------------------------------------------------

export function AddCombobox({
  items = [],
  onSelect,
  placeholder = "เพิ่ม...",
  getLabel,
  renderItem,
  filterFn,
  loading = false,
  disabled = false,
  saving = false,
  className,
  inputPlaceholder,
  emptyText,
  container,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? items.filter((item) =>
        filterFn
          ? filterFn(item, query)
          : (getLabel(item) ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || saving || (loading && items.length === 0)}
          className={cn("gap-1.5 h-8", className)}
        >
          {saving
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Plus className="h-3.5 w-3.5" />}
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start" container={container}>
        <DropdownContent
          items={filtered}
          query={query}
          onQueryChange={setQuery}
          onSelect={(item) => { onSelect(item); setOpen(false); setQuery(""); }}
          getLabel={getLabel}
          renderItem={renderItem}
          loading={loading && items.length === 0}
          emptyText={emptyText ?? "ไม่พบรายการ"}
          inputPlaceholder={inputPlaceholder}
        />
      </PopoverContent>
    </Popover>
  );
}
