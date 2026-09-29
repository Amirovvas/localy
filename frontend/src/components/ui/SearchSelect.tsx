"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import css from "./searchSelect.module.css";
import type { SelectOption } from "@/lib/registerOptions";

interface IProps {
  options: SelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
}

const SearchSelect = ({
  options,
  value,
  onChange,
  placeholder = "Начните вводить название...",
  multiple = true,
}: IProps) => {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectedOptions = options.filter((option) => value.includes(option.id));
  const filtered = options.filter(
    (option) =>
      option.label.toLowerCase().includes(query.trim().toLowerCase()) &&
      (multiple ? !value.includes(option.id) : true),
  );

  const toggle = (id: string) => {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
      setQuery("");
      inputRef.current?.focus();
    } else {
      onChange([id]);
      setOpen(false);
      setQuery("");
    }
  };

  const removeChip = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  const clearSingle = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange([]);
  };

  return (
    <div className={css.root} ref={rootRef}>
      <div
        className={css.control}
        data-open={isOpen}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {multiple &&
          selectedOptions.map((option) => (
            <span key={option.id} className={css.chip}>
              {option.label}
              <button
                type="button"
                className={css.chipRemove}
                onClick={(event) => removeChip(option.id, event)}
                aria-label={`Убрать ${option.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}

        {!multiple && selectedOptions[0] && !isOpen ? (
          <span className={css.singleValue}>
            {selectedOptions[0].label}
            <button
              type="button"
              className={css.chipRemove}
              onClick={clearSingle}
              aria-label="Очистить"
            >
              <X size={12} />
            </button>
          </span>
        ) : (
          <div className={css.inputWrap}>
            <Search size={14} className={css.searchIcon} />
            <input
              ref={inputRef}
              className={css.input}
              placeholder={
                multiple && selectedOptions.length > 0 ? "Добавить ещё..." : placeholder
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setOpen(true)}
            />
          </div>
        )}

        <ChevronDown size={16} className={css.chevron} data-open={isOpen} />
      </div>

      {isOpen && (
        <div className={css.menu}>
          {filtered.length === 0 && <div className={css.empty}>Ничего не найдено</div>}
          {filtered.map((option) => (
            <button
              key={option.id}
              type="button"
              className={css.option}
              onClick={() => toggle(option.id)}
            >
              <span>{option.label}</span>
              {value.includes(option.id) && <Check size={14} className={css.optionCheck} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
