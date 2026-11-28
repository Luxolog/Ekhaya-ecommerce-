"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STORE_THEMES, type ThemeId } from "@/lib/store-themes";

type Appearance = { accent?: string; background?: string; text?: string; headline?: string };
type Props = {
  storeId: string;
  initialTheme: ThemeId;
  initialAppearance: Appearance;
  allowedThemes: ThemeId[];
  advancedCustomization: boolean;
};

const validHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

export default function ThemeStudio({ storeId, initialTheme, initialAppearance, allowedThemes, advancedCustomization }: Props) {
  const [selected, setSelected] = useState<ThemeId>(initialTheme);
  const [appearance, setAppearance] = useState<Appearance>(initialAppearance);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const selectedTheme = useMemo(() => STORE_THEMES.find((theme) => theme.id === selected) ?? STORE_THEMES[0], [selected]);
  const accent = appearance.accent && validHex(appearance.accent) ? appearance.accent : selectedTheme.preview.accent;
  const background = appearance.background && validHex(appearance.background) ? appearance.background : selectedTheme.preview.background;
  const text = appearance.text && validHex(appearance.text) ? appearance.text : selectedTheme.preview.ink;

  async function saveTheme() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/stores/${storeId}/theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: selected, appearance }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save your theme.");
      setMessage("Your storefront design has been saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save your theme.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="theme-studio">
      <div className="theme-studio-heading">
        <div><div className="eyebrow">THEME LIBRARY</div><h2>Choose your storefront look</h2><p>Switch designs whenever you like. Your products, orders and store details stay unchanged.</p></div>
        <Link className="button button-outline" href={`/dashboard/stores/${storeId}`}>Back to store</Link>
      </div>
      <div className="theme-grid">
        {STORE_THEMES.map((theme) => {
          const unlocked = allowedThemes.includes(theme.id);
          const active = selected === theme.id;
          return (
            <button type="button" key={theme.id} className={`theme-choice ${active ? "theme-choice-active" : ""} ${!unlocked ? "theme-choice-locked" : ""}`} onClick={() => { if (unlocked) { setSelected(theme.id); setMessage(""); setAppearance({}); } }} aria-pressed={active} disabled={!unlocked}>
              <div className="theme-preview" data-theme={theme.id} style={{ background: theme.preview.background, color: theme.preview.ink }}>
                <div className="theme-preview-nav"><span>YOUR BRAND</span><span>SHOP　 ABOUT　 BAG</span></div>
                <div className="theme-preview-hero" style={{ background: theme.preview.hero }}>
                  <small>{theme.category.toUpperCase()}</small>
                  <strong>{theme.id === "luxury" ? "The art of living well." : theme.id === "boutique" ? "Made to be noticed." : theme.id === "beauty" ? "A little more you." : theme.id === "retail" ? "Find your everyday favourites." : theme.id === "driving" ? "Your journey starts here." : theme.id === "insurance" ? "Protection for what matters." : theme.id === "household" ? "Make everyday living easier." : "Good things, thoughtfully chosen."}</strong>
                  <i style={{ background: theme.preview.accent }}>EXPLORE</i>
                </div>
                <div className="theme-preview-products"><span/><span/><span/></div>
              </div>
              <div className="theme-choice-info"><div><strong>{theme.name}</strong><small>{theme.description}</small></div><span className={active ? "theme-selected-mark" : "theme-radio"}>{active ? "✓" : ""}</span></div>
              {!unlocked && <span className="theme-lock-label">Available on Business and Growth</span>}
              {active && <span className="theme-active-label">SELECTED</span>}
            </button>
          );
        })}
      </div>
      <section className="theme-customizer">
        <div className="eyebrow">BRAND CUSTOMISATION</div>
        <h2>Make it yours</h2>
        <p>Set a headline and brand colours for your storefront.</p>
        <div className="theme-customizer-grid">
          <label>Homepage headline<input value={appearance.headline ?? ""} maxLength={90} placeholder="A great headline for your store" onChange={(event) => setAppearance((current) => ({ ...current, headline: event.target.value }))} /></label>
          <label>Accent colour<input type="color" value={accent} disabled={!advancedCustomization} onChange={(event) => setAppearance((current) => ({ ...current, accent: event.target.value }))} /></label>
          <label>Page background<input type="color" value={background} disabled={!advancedCustomization} onChange={(event) => setAppearance((current) => ({ ...current, background: event.target.value }))} /></label>
          <label>Text colour<input type="color" value={text} disabled={!advancedCustomization} onChange={(event) => setAppearance((current) => ({ ...current, text: event.target.value }))} /></label>
        </div>
        {!advancedCustomization && <p className="theme-upgrade-note">Custom brand colours are included with Business and Growth. You can still choose either Starter theme and add a homepage headline.</p>}
        <div className="theme-save-row"><span role="status">{message}</span><button className="button button-primary" type="button" onClick={saveTheme} disabled={saving}>{saving ? "Saving…" : "Save storefront design"}</button></div>
      </section>
      <aside className="theme-live-preview" style={{ background, color: text, borderColor: accent }}>
        <div className="eyebrow">DESIGN PREVIEW</div><h3>{appearance.headline?.trim() || selectedTheme.name + " for your brand"}</h3><p>{selectedTheme.description}</p><span style={{ background: accent }}>SHOP COLLECTION</span>
      </aside>
    </div>
  );
}
