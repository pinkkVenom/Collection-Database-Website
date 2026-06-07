document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("categorySelect");
  const itemSelect = document.getElementById("itemSelect");
  const photocardForm = document.getElementById("photocardForm");
  const albumForm = document.getElementById("albumForm");

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
    clearDropdown();
    hideAllForms();

    if (currentCategory === "photocard") loadDropdown("/api/ownedPhotocards", formatPhotocardOption);
    if (currentCategory === "album") loadDropdown("/api/ownedItems", formatAlbumOption);
  });

  // -------------------------
  // Item selection change
  // -------------------------
  itemSelect.addEventListener("change", () => {
    const id = itemSelect.value;
    if (!id || !currentCategory) return;
    currentItemId = id;

    hideAllForms();

    if (currentCategory === "photocard") loadItemData(`/api/ownedPhotocards/${id}`, photocardForm, mapPhotocardData);
    if (currentCategory === "album") loadItemData(`/api/ownedItems/${id}`, albumForm, mapAlbumData);
  });

  // -------------------------
  // Helper to load dropdown
  // -------------------------
  function loadDropdown(url, formatOption) {
    fetch(url)
      .then(res => res.json())
      .then(items => {
        items.forEach(item => {
          const option = document.createElement("option");
          option.value = item.id;
          option.textContent = formatOption(item);
          itemSelect.appendChild(option);
        });
      })
      .catch(err => console.error(`Failed to load dropdown:`, err));
  }

  function formatPhotocardOption(pc) {
    return `${pc.artist_name} — ${pc.member} — ${pc.pc_version || "Unknown"}`;
  }

  function formatAlbumOption(album) {
    return `${album.artist_name} — ${album.item_name}`;
  }

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

  function clearDropdown() {
    itemSelect.innerHTML = `<option value="">— Select an item —</option>`;
  }

  function setFormValues(form, values) {
    for (const [key, val] of Object.entries(values)) {
      if (form.elements[key]) form.elements[key].value = val;
    }
  }

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


