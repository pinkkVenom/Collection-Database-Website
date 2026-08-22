document.addEventListener("DOMContentLoaded", () => {
  initMuseum();
});

const overviewGrid = document.getElementById("overviewGrid");
const itemsGrid = document.getElementById("itemsGrid");
const photocardsGrid = document.getElementById("photocardsGrid");
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

const albumFilterState = {
  item_type: "all",
  artist_name: "all",
  nameSearch: ""
};

const photocardFilterState = {
  artist_name: "all",
  member: "all",
  era: "all",
  nameSearch: ""
};

let itemIdSearchTerm = "";
let pcIdSearchTerm = "";

// -------------------------
//formatting for item information
// -------------------------
function formatLabel(value) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")                 // underscores → spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // capitalize first letter of each word
}

function formatRarity(tier) {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function getRarityClass(rarity) {
  if (!rarity) return "rarity-unknown";
  return `rarity-${rarity.toLowerCase()}`;
}

// -------------------------
//gets all data at once
// -------------------------
async function loadData() {
  const [itemsRes, pcsRes] = await Promise.all([
    fetch("/api/ownedItems"),
    fetch("/api/ownedPhotocards")
  ]);

  allItems = await itemsRes.json();
  allPhotocards = await pcsRes.json();

  populateItemFilters();
  populatePhotocardFilters();
}

// -------------------------
//rendering/loading active tab
// -------------------------
function renderInitialTab() {
  const activeTab = document.querySelector(".tab.active");

  if (!activeTab) return;

  const tabId = activeTab.dataset.tab;

  // Clear all grids first
  overviewGrid.innerHTML = "";
  itemsGrid.innerHTML = "";
  photocardsGrid.innerHTML = "";

  if (tabId === "overviewTab") {
    renderOverview();
  }

  if (tabId === "itemsTab") {
    applyItemFilters(); // respects saved filter state
  }

  if (tabId === "photocardsTab") {
    applyPhotocardFilters();
  }
}

// -------------------------
//change active tab based on which button the user clicks
// -------------------------
function setupTabListeners() {
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(tc => tc.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");

      renderInitialTab();
    });
  });
}


// -------------------------
//MUSEUM PAGE INITIALIZATION
// -------------------------
async function initMuseum() {
  await loadData();
  renderInitialTab();
  setupTabListeners();
}

// -------------------------
//random mix for Overview
// -------------------------
function renderOverview() {
  const grid = document.getElementById("overviewGrid");
  grid.innerHTML = "";

  // Combine albums and photocards
  const combined = [...allItems, ...allPhotocards];
    
  if (combined.length === 0) return;

  // Shuffle array and pick first N items (e.g., 10)
  const shuffled = combined.sort(() => 0.5 - Math.random()).slice(0, 10);

  shuffled.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    if (item.item_name) {
      // Album
      card.innerHTML = `
        <div class="image-wrapper square">
            ${item.image_front_url ? `<img src="${item.image_front_url}" alt="${item.member}" class="image">` : ""}
        </div>
        <div class="main-text">
            <h3 class="title-text">${item.item_name}</h3>
            <p class="sub-text">${item.artist_name}</p>
        </div>
      `;
    } else if (item.member) {
      // Photocard
      card.innerHTML = `
        <div class="image-wrapper">
            ${item.image_front_url ? `<img src="${item.image_front_url}" alt="${item.member}" class="image">` : ""}
        </div>
        <div class="main-text">
            <h3 class="title-text">${item.member}</h3>
            <p class="sub-text">${item.artist_name}</p>
        </div>
      `;
    }

    grid.appendChild(card);
  });
}

// -------------------------
//retrieve album filters
// -------------------------
let allItems = [];

function populateItemFilters() {
  const groupSelect = document.getElementById("itemGroupFilter");

  groupSelect.innerHTML = `<option value="all">All Artists</option>`;

  const groups = [...new Set(
    allItems
      .map(i => i.artist_name)
      .filter(Boolean)
  )].sort();

  groups.forEach(g => {
    groupSelect.appendChild(new Option(g, g));
  });
}

function renderItems(items) {
  const grid = document.getElementById("itemsGrid");
  grid.innerHTML = "";

  if (items.length === 0) {
    grid.innerHTML = `<p class="empty-state">No items match your filters.</p>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    let cardHTML = `
    <div class="image-wrapper square">
        ${item.image_front_url ? `<img src="${item.image_front_url}" alt="${item.member}" class="image">` : ""}
    </div>
    <div class="main-text">
        <h3 class="title-text">${item.item_name}</h3>
        <p class="sub-text">${item.artist_name}</p>
    </div>
    <div class="text-meta">
        <div><span>Item Type</span><span>${formatLabel(item.item_type) || "Unknown"}</span></div>
        <div><span>Publishing Label</span><span>${item.publishing_label || "Unknown"}</span></div>
        <div>
          <span>KOMCA</span>
          <span>
            ${
              item.komca_number !== null && item.komca_number !== undefined
                ? item.komca_number
                : "Unknown"
            }
          </span>
        </div>
        <div><span>Release Date</span><span>${item.release_date || "Unknown"}</span></div>
        <div>
          <span>Rarity</span>
          <span>${formatLabel(item.item_rarity) || "Unknown"}</span>
        </div>
        <div><span>Purchase Location</span><span>${item.purchase_location || "Unknown"}</span></div>
        <div><span>Condition</span><span>${formatLabel(item.condition) || "Unknown"}</span></div>
        <div><span>Estimated Market Price</span><span>${item.est_marketprice || "Unknown"}</span></div>
        <div><span>ID</span><span>${item.id}</span></div>
    `;

    // Only add notes div if notes exist and are not empty or just whitespace
    if (item.notes && item.notes.trim() !== "") {
        cardHTML += `
        <div class="notes">
            <strong>Notes:</strong> ${item.notes}
        </div>
        `;
  }
    card.innerHTML = cardHTML;
    grid.appendChild(card);
  });
}

document.getElementById("itemTypeFilter").addEventListener("change", e => {
  albumFilterState.item_type = e.target.value;
  applyItemFilters();
});

document.getElementById("itemGroupFilter").addEventListener("change", e => {
  albumFilterState.artist_name = e.target.value;
  applyItemFilters();
});

document.getElementById("itemIdSearch").addEventListener("input", e => {
  itemIdSearchTerm = e.target.value.trim();
  applyItemFilters();
});

document.getElementById("itemNameSearch")
  .addEventListener("input", e => {
    albumFilterState.nameSearch = e.target.value.toLowerCase().trim();
    applyItemFilters();
});


function applyItemFilters() {
  let filtered = [...allItems];

  if (albumFilterState.item_type !== "all") {
    filtered = filtered.filter(item =>
      item.item_type?.toLowerCase() === albumFilterState.item_type.toLowerCase()
    );
  }

  if (albumFilterState.artist_name !== "all") {
    filtered = filtered.filter(item =>
      item.artist_name?.toLowerCase() === albumFilterState.artist_name.toLowerCase()
    );
  }

  if (itemIdSearchTerm !== "") {
    albumFilterState.item_type = "all";
    albumFilterState.artist_name = "all";
    filtered = filtered.filter(item =>
      String(item.id) === itemIdSearchTerm
    );
  }
  if (albumFilterState.nameSearch) {
    const search = albumFilterState.nameSearch;

    filtered = filtered.filter(item =>
      item.item_name?.toLowerCase().includes(search) ||
      item.artist_name?.toLowerCase().includes(search)
    );
  }


  renderItems(filtered);
}

// -------------------------
//retrieve photocard filters
// -------------------------
let allPhotocards = [];

function populatePhotocardFilters() {
  const groupSelect = document.getElementById("pcGroupFilter");
  const memberSelect = document.getElementById("pcMemberFilter");
  const eraSelect = document.getElementById("pcEraFilter");

  const groups = [...new Set(allPhotocards.map(p => p.artist_name))].sort();
  const members = [...new Set(allPhotocards.map(p => p.member))].sort();
  const eras = [...new Set(allPhotocards.map(p => p.era).filter(Boolean))].sort();

  groups.forEach(g => groupSelect.appendChild(new Option(g, g)));
  members.forEach(m => memberSelect.appendChild(new Option(m, m)));
  if (eraSelect) eras.forEach(e => eraSelect.appendChild(new Option(e, e)));
}

// -------------------------
// builds the composed "Era — Variant (Format) — Outfit" label
// falls back to the old free-text version for cards that haven't
// been backfilled with era/outfit yet, and flags them as legacy
// -------------------------
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

function renderPhotocards(cards) {
  const grid = document.getElementById("photocardsGrid");
  grid.innerHTML = "";

  if (cards.length === 0) {
    grid.innerHTML = `<p class="empty-state">No photocards found.</p>`;
    return;
  }

  cards.forEach(pc => {
    const card = document.createElement("div");
    card.className = "item-card";

    const imageHTML = pc.image_front_url
      ? `
        <div class="pc-flip-card">
          <div class="pc-flip-inner ${pc.image_back_url}">
            <div class="pc-front">
              <img src="${pc.image_front_url}" alt="${pc.member} front">
            </div>
            <div class="pc-back">
              ${
                pc.image_back_url
                  ? `<img src="${pc.image_back_url}" alt="${pc.member} back">`
                  : `
                    <div class="pc-back-placeholder">
                      <span>No image yet</span>
                    </div>
                  `
              }
            </div>
          </div>
        </div>
      `
      : '';

    const { label: pcLabel, legacy: pcLegacy } = buildPhotocardLabel(pc);

    let cardHTML = `
      <div class="image-wrapper">
        ${imageHTML}
      </div>

      <div class="main-text">
        <h3 class="title-text">${pc.member}</h3>
        <p class="sub-text">${pc.artist_name}</p>
      </div>

      <div>
        <span>Rarity</span>
        <span class="rarity-badge ${getRarityClass(pc.pc_rarity)}">
          ${formatLabel(pc.pc_rarity) || "Unknown"}
        </span>
      </div>

      <div class="pc-label">
        ${pcLabel}
        ${pcLegacy ? '<span class="legacy-tag">Needs era/outfit</span>' : ''}
      </div>

      <div class="text-meta">
        <div><span>Source</span><span>${formatLabel(pc.pc_source) || "Unknown"}</span></div>
        <div><span>Trade Value</span><span class="highlight">${pc.trade_value || "Unknown"}</span></div>
        <div><span>Condition</span><span>${formatLabel(pc.condition) || "Unknown"}</span></div>
        <div><span>Purchase</span><span>${pc.purchase_location || "Unknown"}</span></div>
        <div><span>ID</span><span>${pc.id}</span></div>
      </div>
    `;

    // Notes go OUTSIDE meta and only render if meaningful
    if (pc.notes && pc.notes.trim() !== "") {
      cardHTML += `
        <div class="notes">
          <strong>Notes:</strong> ${pc.notes}
        </div>
      `;
    }

    card.innerHTML = cardHTML;
    grid.appendChild(card);
  });
}

// -------------------------
//handlers for filtering
//(filtering by group, member)
//(id search function)
//(photocard flips when clicked so you can see the back)
// -------------------------
document.getElementById("pcGroupFilter").addEventListener("change", e => {
  photocardFilterState.artist_name = e.target.value;
  applyPhotocardFilters();
});

document.getElementById("pcMemberFilter").addEventListener("change", e => {
  photocardFilterState.member = e.target.value;
  applyPhotocardFilters();
});

const pcEraFilterEl = document.getElementById("pcEraFilter");
if (pcEraFilterEl) {
  pcEraFilterEl.addEventListener("change", e => {
    photocardFilterState.era = e.target.value;
    applyPhotocardFilters();
  });
}

document.getElementById("pcIdSearch").addEventListener("input", e => {
  pcIdSearchTerm = e.target.value.trim();
  applyPhotocardFilters();
});

document.getElementById("pcNameSearch")
  .addEventListener("input", e => {
    photocardFilterState.nameSearch = e.target.value.toLowerCase().trim();
    applyPhotocardFilters();
});

document.addEventListener('click', (e) => {
  const flipInner = e.target.closest('.pc-flip-inner');

  if (!flipInner || flipInner.classList.contains('no-flip')) return;

  flipInner.classList.toggle('flipped');
});

// -------------------------
//apply filters to webpage
// -------------------------
function applyPhotocardFilters() {
  let filtered = [...allPhotocards];

  if (photocardFilterState.artist_name !== "all") {
    filtered = filtered.filter(pc =>
      pc.artist_name?.toLowerCase() === photocardFilterState.artist_name.toLowerCase()
    );
  }

  if (photocardFilterState.member !== "all") {
    filtered = filtered.filter(pc =>
      pc.member?.toLowerCase() === photocardFilterState.member.toLowerCase()
    );
  }

  if (photocardFilterState.era !== "all") {
    filtered = filtered.filter(pc =>
      pc.era?.toLowerCase() === photocardFilterState.era.toLowerCase()
    );
  }

  if (pcIdSearchTerm !== "") {
    photocardFilterState.artist_name = "all";
    photocardFilterState.member = "all";
    photocardFilterState.era = "all";
    filtered = filtered.filter(pc =>
      String(pc.id) === pcIdSearchTerm
    );
  }

  if (photocardFilterState.nameSearch) {
    const search = photocardFilterState.nameSearch;

    filtered = filtered.filter(pc =>
      pc.pc_version?.toLowerCase().includes(search) ||
      pc.member?.toLowerCase().includes(search) ||
      pc.era?.toLowerCase().includes(search) ||
      pc.outfit?.toLowerCase().includes(search) ||
      pc.variant?.toLowerCase().includes(search) ||
      pc.format?.toLowerCase().includes(search)
    );
  }

  renderPhotocards(filtered);
}
