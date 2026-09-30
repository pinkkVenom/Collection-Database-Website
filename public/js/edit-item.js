document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("categorySelect");
  const photocardForm = document.getElementById("photocardForm");
  const albumForm = document.getElementById("albumForm");

  const albumBrowserSection = document.getElementById("albumBrowserSection");
  const photocardBrowserSection = document.getElementById("photocardBrowserSection");

  const imageInput = albumForm.querySelector('[name="image_front"]');


  if (imageInput) {
  imageInput.value = "";
}

  // -------------------------
  // Category change
  // -------------------------
  categorySelect.addEventListener("change", () => {
    currentCategory = categorySelect.value;
    currentItemId = null;
    hideAllForms();
    clearAlbumSelection();
    clearPhotocardSelection();

    albumBrowserSection.classList.add("hidden");
    photocardBrowserSection.classList.add("hidden");

    if (currentCategory === "album") {
      albumBrowserSection.classList.remove("hidden");
      loadAlbumPicker();
    }

    if (currentCategory === "photocard") {
      photocardBrowserSection.classList.remove("hidden");
      loadPhotocardPicker();
    }
  });

  // -------------------------
  // Helper to load item data into a form
  // -------------------------
  function loadItemData(url, form, mapDataFn) {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        mapDataFn(form, data);
        form.classList.remove("hidden");
      })
      .catch(err => console.error("Failed to load item data:", err));
  }

  // -------------------------
  // Map data to forms
  // -------------------------
  function mapPhotocardData(form, pc) {
    setFormValues(form, {
      artist_name: pc.artist_name,
      member: pc.member,
      pc_source: pc.pc_source,
      pc_version: pc.pc_version,
      era: pc.era ?? "",
      outfit: pc.outfit ?? "",
      variant: pc.variant ?? "",
      format: pc.format ?? "",
      region: pc.region ?? "",
      pc_rarity: pc.pc_rarity,
      condition: pc.condition,
      purchase_location: pc.purchase_location,
      trade_value: pc.trade_value,
      image_front_url: pc.image_front_url,
      image_back_url: pc.image_back_url,
      notes: pc.notes
    });
  }

  function mapAlbumData(form, album) {
    setFormValues(form, {
      item_type: album.item_type,
      item_name: album.item_name,
      artist_name: album.artist_name,
      publishing_label: album.publishing_label,
      komca_number: album.komca_number ?? "",
      release_date: album.release_date,
      item_rarity: album.item_rarity,
      region: album.region ?? "",
      purchase_location: album.purchase_location,
      condition: album.condition,
      est_marketprice: album.est_marketprice ?? "",
      notes: album.notes,
      image_front_url: album.image_front_url
    });
  }

  // -------------------------
  // Helper Functions
  // -------------------------
  function hideAllForms() {
    photocardForm.classList.add("hidden");
    albumForm.classList.add("hidden");
  }

  function setFormValues(form, values) {
    for (const [key, val] of Object.entries(values)) {
      if (form.elements[key]) form.elements[key].value = val;
    }
  }

  // -------------------------
  // Photocard browser: search/filter a museum-style grid instead of
  // scrolling one giant dropdown, then click a card to load it below.
  // -------------------------
  let allPhotocardsForPicker = [];
  let selectedPhotocardCard = null;

  const pcPickerFilterState = {
    artist_name: "all",
    member: "all",
    era: "all",
    region: "all",
    nameSearch: ""
  };
  let pcPickerIdSearchTerm = "";

  const pcGroupFilterEl = document.getElementById("editPcGroupFilter");
  const pcMemberFilterEl = document.getElementById("editPcMemberFilter");
  const pcEraFilterEl = document.getElementById("editPcEraFilter");
  const pcRegionFilterEl = document.getElementById("editPcRegionFilter");
  const pcIdSearchEl = document.getElementById("editPcIdSearch");
  const pcNameSearchEl = document.getElementById("editPcNameSearch");
  const photocardPickerGrid = document.getElementById("editPhotocardsGrid");

  function clearPhotocardSelection() {
    if (selectedPhotocardCard) {
      selectedPhotocardCard.classList.remove("selected");
      selectedPhotocardCard = null;
    }
  }

  function loadPhotocardPicker() {
    fetch("/api/ownedPhotocards")
      .then(res => res.json())
      .then(cards => {
        allPhotocardsForPicker = cards;
        populatePickerFilters();
        applyPickerFilters();
      })
      .catch(err => console.error("Failed to load photocards:", err));
  }

  function populatePickerFilters() {
    pcGroupFilterEl.innerHTML = `<option value="all">All Groups</option>`;
    pcMemberFilterEl.innerHTML = `<option value="all">All Members</option>`;
    pcEraFilterEl.innerHTML = `<option value="all">All Eras</option>`;
    pcRegionFilterEl.innerHTML = `<option value="all">All Regions</option>`;

    const groups = [...new Set(allPhotocardsForPicker.map(p => p.artist_name).filter(Boolean))].sort();
    const members = [...new Set(allPhotocardsForPicker.map(p => p.member).filter(Boolean))].sort();
    const eras = [...new Set(allPhotocardsForPicker.map(p => p.era).filter(Boolean))].sort();
    const regions = [...new Set(allPhotocardsForPicker.map(p => p.region).filter(Boolean))].sort();

    groups.forEach(g => pcGroupFilterEl.appendChild(new Option(g, g)));
    members.forEach(m => pcMemberFilterEl.appendChild(new Option(m, m)));
    eras.forEach(e => pcEraFilterEl.appendChild(new Option(e, e)));
    regions.forEach(r => pcRegionFilterEl.appendChild(new Option(formatLabel(r), r)));
  }

  function applyPickerFilters() {
    let filtered = [...allPhotocardsForPicker];

    if (pcPickerFilterState.artist_name !== "all") {
      filtered = filtered.filter(pc =>
        pc.artist_name?.toLowerCase() === pcPickerFilterState.artist_name.toLowerCase()
      );
    }

    if (pcPickerFilterState.member !== "all") {
      filtered = filtered.filter(pc =>
        pc.member?.toLowerCase() === pcPickerFilterState.member.toLowerCase()
      );
    }

    if (pcPickerFilterState.era !== "all") {
      filtered = filtered.filter(pc =>
        pc.era?.toLowerCase() === pcPickerFilterState.era.toLowerCase()
      );
    }

    if (pcPickerFilterState.region !== "all") {
      filtered = filtered.filter(pc =>
        pc.region?.toLowerCase() === pcPickerFilterState.region.toLowerCase()
      );
    }

    if (pcPickerIdSearchTerm !== "") {
      filtered = filtered.filter(pc => String(pc.id) === pcPickerIdSearchTerm);
    }

    if (pcPickerFilterState.nameSearch) {
      const search = pcPickerFilterState.nameSearch;
      filtered = filtered.filter(pc =>
        pc.pc_version?.toLowerCase().includes(search) ||
        pc.member?.toLowerCase().includes(search) ||
        pc.era?.toLowerCase().includes(search) ||
        pc.outfit?.toLowerCase().includes(search) ||
        pc.variant?.toLowerCase().includes(search) ||
        pc.format?.toLowerCase().includes(search) ||
        pc.region?.toLowerCase().includes(search)
      );
    }

    renderPhotocardPicker(filtered);
  }

  function renderPhotocardPicker(cards) {
    photocardPickerGrid.innerHTML = "";

    if (cards.length === 0) {
      photocardPickerGrid.innerHTML = `<p class="empty-state">No photocards match your filters.</p>`;
      return;
    }

    cards.forEach(pc => {
      const card = document.createElement("div");
      card.className = "item-card picker-card";
      card.dataset.id = pc.id;

      const { label: pcLabel, legacy: pcLegacy } = buildPhotocardLabel(pc);

      card.innerHTML = `
        <div class="image-wrapper">
          ${pc.image_front_url ? `<img src="${pc.image_front_url}" alt="${pc.member}" class="image">` : ""}
        </div>

        <div class="main-text">
          <h3 class="title-text">${pc.member}</h3>
          <p class="sub-text">${pc.artist_name}</p>
        </div>

        <span class="rarity-badge ${getRarityClass(pc.pc_rarity)}">
          ${formatLabel(pc.pc_rarity) || "Unknown"}
        </span>

        <div class="pc-label">
          ${pcLabel}
          ${pcLegacy ? '<span class="legacy-tag">Needs era/outfit</span>' : ''}
        </div>

        <div class="picker-id">ID #${pc.id}</div>

        <button type="button" class="picker-select-btn">Edit this card</button>
      `;

      card.querySelector(".picker-select-btn").addEventListener("click", () => {
        selectPhotocardForEdit(pc.id, card);
      });

      photocardPickerGrid.appendChild(card);
    });
  }

  function selectPhotocardForEdit(id, cardEl) {
    currentCategory = "photocard";
    currentItemId = id;

    clearPhotocardSelection();
    cardEl.classList.add("selected");
    selectedPhotocardCard = cardEl;

    loadItemData(`/api/ownedPhotocards/${id}`, photocardForm, mapPhotocardData);
    photocardForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  pcGroupFilterEl.addEventListener("change", e => {
    pcPickerFilterState.artist_name = e.target.value;
    applyPickerFilters();
  });

  pcMemberFilterEl.addEventListener("change", e => {
    pcPickerFilterState.member = e.target.value;
    applyPickerFilters();
  });

  pcEraFilterEl.addEventListener("change", e => {
    pcPickerFilterState.era = e.target.value;
    applyPickerFilters();
  });

  pcRegionFilterEl.addEventListener("change", e => {
    pcPickerFilterState.region = e.target.value;
    applyPickerFilters();
  });

  pcIdSearchEl.addEventListener("input", e => {
    pcPickerIdSearchTerm = e.target.value.trim();
    applyPickerFilters();
  });

  pcNameSearchEl.addEventListener("input", e => {
    pcPickerFilterState.nameSearch = e.target.value.toLowerCase().trim();
    applyPickerFilters();
  });

  // -------------------------
  // Album browser: same idea as the photocard picker above, just against
  // /api/ownedItems and the album fields (much smaller list, but keeps
  // the interaction consistent between the two categories).
  // -------------------------
  let allItemsForPicker = [];
  let selectedAlbumCard = null;

  const itemPickerFilterState = {
    item_type: "all",
    artist_name: "all",
    region: "all",
    nameSearch: ""
  };
  let itemPickerIdSearchTerm = "";

  const itemTypeFilterEl = document.getElementById("editItemTypeFilter");
  const itemGroupFilterEl = document.getElementById("editItemGroupFilter");
  const itemRegionFilterEl = document.getElementById("editItemRegionFilter");
  const itemIdSearchEl = document.getElementById("editItemIdSearch");
  const itemNameSearchEl = document.getElementById("editItemNameSearch");
  const itemPickerGrid = document.getElementById("editItemsGrid");

  function clearAlbumSelection() {
    if (selectedAlbumCard) {
      selectedAlbumCard.classList.remove("selected");
      selectedAlbumCard = null;
    }
  }

  function loadAlbumPicker() {
    fetch("/api/ownedItems")
      .then(res => res.json())
      .then(items => {
        allItemsForPicker = items;
        populateAlbumPickerFilters();
        applyAlbumPickerFilters();
      })
      .catch(err => console.error("Failed to load albums:", err));
  }

  function populateAlbumPickerFilters() {
    itemGroupFilterEl.innerHTML = `<option value="all">All Artists</option>`;
    itemRegionFilterEl.innerHTML = `<option value="all">All Regions</option>`;

    const groups = [...new Set(allItemsForPicker.map(i => i.artist_name).filter(Boolean))].sort();
    const regions = [...new Set(allItemsForPicker.map(i => i.region).filter(Boolean))].sort();

    groups.forEach(g => itemGroupFilterEl.appendChild(new Option(g, g)));
    regions.forEach(r => itemRegionFilterEl.appendChild(new Option(formatLabel(r), r)));
  }

  function applyAlbumPickerFilters() {
    let filtered = [...allItemsForPicker];

    if (itemPickerFilterState.item_type !== "all") {
      filtered = filtered.filter(item =>
        item.item_type?.toLowerCase() === itemPickerFilterState.item_type.toLowerCase()
      );
    }

    if (itemPickerFilterState.artist_name !== "all") {
      filtered = filtered.filter(item =>
        item.artist_name?.toLowerCase() === itemPickerFilterState.artist_name.toLowerCase()
      );
    }

    if (itemPickerFilterState.region !== "all") {
      filtered = filtered.filter(item =>
        item.region?.toLowerCase() === itemPickerFilterState.region.toLowerCase()
      );
    }

    if (itemPickerIdSearchTerm !== "") {
      filtered = filtered.filter(item => String(item.id) === itemPickerIdSearchTerm);
    }

    if (itemPickerFilterState.nameSearch) {
      const search = itemPickerFilterState.nameSearch;
      filtered = filtered.filter(item =>
        item.item_name?.toLowerCase().includes(search) ||
        item.artist_name?.toLowerCase().includes(search) ||
        item.region?.toLowerCase().includes(search)
      );
    }

    renderAlbumPicker(filtered);
  }

  function renderAlbumPicker(items) {
    itemPickerGrid.innerHTML = "";

    if (items.length === 0) {
      itemPickerGrid.innerHTML = `<p class="empty-state">No albums/items match your filters.</p>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card picker-card";
      card.dataset.id = item.id;

      card.innerHTML = `
        <div class="image-wrapper square">
          ${item.image_front_url ? `<img src="${item.image_front_url}" alt="${item.item_name}" class="image">` : ""}
        </div>

        <div class="main-text">
          <h3 class="title-text">${item.item_name}</h3>
          <p class="sub-text">${item.artist_name}</p>
        </div>

        <span class="rarity-badge ${getRarityClass(item.item_rarity)}">
          ${formatLabel(item.item_rarity) || "Unknown"}
        </span>

        <div class="pc-label">${formatLabel(item.item_type) || "Unknown"}</div>

        <div class="picker-id">ID #${item.id}</div>

        <button type="button" class="picker-select-btn">Edit this item</button>
      `;

      card.querySelector(".picker-select-btn").addEventListener("click", () => {
        selectAlbumForEdit(item.id, card);
      });

      itemPickerGrid.appendChild(card);
    });
  }

  function selectAlbumForEdit(id, cardEl) {
    currentCategory = "album";
    currentItemId = id;

    clearAlbumSelection();
    cardEl.classList.add("selected");
    selectedAlbumCard = cardEl;

    loadItemData(`/api/ownedItems/${id}`, albumForm, mapAlbumData);
    albumForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  itemTypeFilterEl.addEventListener("change", e => {
    itemPickerFilterState.item_type = e.target.value;
    applyAlbumPickerFilters();
  });

  itemGroupFilterEl.addEventListener("change", e => {
    itemPickerFilterState.artist_name = e.target.value;
    applyAlbumPickerFilters();
  });

  itemRegionFilterEl.addEventListener("change", e => {
    itemPickerFilterState.region = e.target.value;
    applyAlbumPickerFilters();
  });

  itemIdSearchEl.addEventListener("input", e => {
    itemPickerIdSearchTerm = e.target.value.trim();
    applyAlbumPickerFilters();
  });

  itemNameSearchEl.addEventListener("input", e => {
    itemPickerFilterState.nameSearch = e.target.value.toLowerCase().trim();
    applyAlbumPickerFilters();
  });

  // -------------------------
  // Form submission (updates the database with your edits)
  // -------------------------
  photocardForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentItemId) {
      console.error("No photocard selected");
      return;
    }

    const formData = new FormData(photocardForm);


    const res = await fetch(`/api/ownedPhotocards/${currentItemId}`, {
    method: "PUT",
    body: formData
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Server error response:", text);
      return;
    }

    const data = await res.json();
    console.log("Success:", data);
    console.log("Update result:", data);
    alert("Photocard updated!");
  });

  albumForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentItemId) {
      console.error("No album selected");
      return;
    }

    const formData = new FormData(albumForm);

    const res = await fetch(`/api/ownedItems/${currentItemId}`, {
      method: "PUT",
      body: formData
    });

    const data = await res.json();
    console.log("Success:", data);
    console.log("Update result:", data);
    alert("Album updated!");
  });
});
