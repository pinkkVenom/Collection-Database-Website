// -------------------------
// Shared photocard display helpers.
// Used by museum.js (collection browser) and edit-item.js (edit picker)
// so the "Era — Variant (Format) — Outfit" label logic lives in one place
// instead of drifting between the two pages.
// -------------------------

function formatLabel(value) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")                 // underscores → spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // capitalize first letter of each word
}

function getRarityClass(rarity) {
  if (!rarity) return "rarity-unknown";
  return `rarity-${rarity.toLowerCase()}`;
}

// builds the composed "Era — Variant (Format) — Outfit" label
// falls back to the old free-text version for cards that haven't
// been backfilled with era/outfit yet, and flags them as legacy
function buildPhotocardLabel(pc) {
  const hasNewFields = pc.era || pc.outfit || pc.variant || pc.format;

  if (!hasNewFields) {
    return {
      label: pc.pc_version ? formatLabel(pc.pc_version) : "Unknown",
      legacy: true
    };
  }

  let variantFormat = null;
  if (pc.variant && pc.format) {
    variantFormat = `${pc.variant} (${pc.format})`;
  } else if (pc.variant) {
    variantFormat = pc.variant;
  } else if (pc.format) {
    variantFormat = pc.format;
  }

  const parts = [pc.era, variantFormat, pc.outfit].filter(Boolean);

  return {
    label: parts.length ? parts.join(" — ") : "Unknown",
    legacy: false
  };
}
