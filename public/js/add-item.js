document.addEventListener("DOMContentLoaded", () => {
const categorySelect = document.getElementById("categorySelect");
const itemForm = document.getElementById("itemForm");
const photocardForm = document.getElementById("photocardForm");

if (!categorySelect) return;
// -------------------------
//hides certain form type based on which item type youre adding to database
// -------------------------
function hideAllForms() {
  itemForm.classList.add("hidden");
  photocardForm.classList.add("hidden");
}

categorySelect.addEventListener("change", () => {
  currentCategory = categorySelect.value;

  hideAllForms();

  if (!currentCategory) return;

  if (currentCategory === "photocard") {
    photocardForm.classList.remove("hidden");
  }

  if (currentCategory === "item") {
    itemForm.classList.remove("hidden");
  }
});

// -------------------------
//submit to items API
// -------------------------
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(itemForm);
  try {
    const response = await fetch("/api/ownedItems", {
      method: "POST",
      body: formData
    });
    
    const result = await response.json();
    console.log(result);
    alert("Item added successfully!");
    itemForm.reset();

  } catch (err) {

    console.error(err);
    alert("Failed to add item.");

  }
});

// -------------------------
//submit to photocards API
// -------------------------
photocardForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(photocardForm);
  try {
    const response = await fetch("/api/ownedPhotocards", {
      method: "POST",
      body: formData
    });
    
    const result = await response.json();
    console.log(result);
    alert("Photocard added successfully!");
    photocardForm.reset();

  } catch (err) {

    console.error(err);
    alert("Failed to add photocard.");

  }

});

});

//temp
//DELETE FROM ownedPhotocards;
//DELETE FROM sqlite_sequence WHERE name='ownedPhotocards';