import React, { useState, useRef, useEffect } from "react";
import { Smile, Search, X } from "lucide-react";

export const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: "Tecnologia & IA",
    icon: "💻",
    emojis: ["💻", "🧠", "🤖", "⚡", "🌐", "🔬", "📊", "🧬", "📱", "📡", "🖥️", "⚙️", "🔒", "🗄️", "🚀", "💡", "🔌", "🕹️", "🔭", "🧪"],
  },
  {
    name: "Estudos & Humanas",
    icon: "📚",
    emojis: ["📚", "🎓", "🏛️", "⚖️", "📖", "📝", "✍️", "🔍", "🧭", "📜", "🗣️", "🌍", "🎨", "🎭", "🎻", "✒️", "🎒", "📐", "🗺️", "📰"],
  },
  {
    name: "Metas & Performance",
    icon: "🎯",
    emojis: ["🎯", "🏆", "🔥", "📈", "⏳", "⏱️", "♟️", "🛡️", "🧩", "💎", "🔑", "🌟", "🥇", "🚩", "⭐", "🏹", "👑", "🎪", "🏷️", "📌"],
  },
  {
    name: "Vida & Bem-Estar",
    icon: "🌿",
    emojis: ["🩺", "🌲", "🏃", "🍎", "🧘", "🌿", "🥋", "🚴", "💧", "🏕️", "✈️", "🛠️", "💼", "💰", "🌱", "☕", "🥑", "🏋️", "🌞", "🌙"],
  },
];

export function EmojiPickerSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredCategories = EMOJI_CATEGORIES.map(cat => {
    if (!search.trim()) return cat;
    const q = search.toLowerCase();
    const isCatMatch = cat.name.toLowerCase().includes(q);
    if (isCatMatch) return cat;
    const matchingEmojis = cat.emojis.filter(e => e.includes(q));
    return { ...cat, emojis: matchingEmojis };
  }).filter(cat => cat.emojis.length > 0);

  return (
    <div className="emoji-picker-container" ref={popoverRef}>
      <label style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-soft)", display: "block", marginBottom: "6px" }}>
        Ícone (Emoji)
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        className="emoji-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Clique para escolher um emoji"
      >
        <span className="current-emoji">{value || "🌐"}</span>
        <Smile size={13} style={{ color: "var(--text-dim)" }} />
      </button>

      {/* Popover Grid */}
      {isOpen && (
        <div className="emoji-picker-popover">
          <div className="emoji-picker-header">
            <div className="emoji-search-row">
              <Search size={13} style={{ color: "var(--text-dim)" }} />
              <input
                type="text"
                placeholder="Filtrar categorias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="emoji-categories-scroll">
            {filteredCategories.map((cat) => (
              <div key={cat.name} className="emoji-category-block">
                <div className="emoji-category-title">
                  <span>{cat.icon}</span> {cat.name}
                </div>
                <div className="emoji-grid-cells">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`emoji-cell-btn ${value === emoji ? "selected" : ""}`}
                      onClick={() => {
                        onChange(emoji);
                        setIsOpen(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div style={{ textAlign: "center", padding: "16px", color: "var(--text-dim)", fontSize: "12px" }}>
                Nenhum emoji encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
