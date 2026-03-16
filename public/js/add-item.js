const categorySelect = document.getElementById("categorySelect");
const itemForm = document.getElementById("itemForm");
const photocardForm = document.getElementById("photocardForm");

categorySelect.addEventListener("change", () => {
  itemForm.classList.add("hidden");
  photocardForm.classList.add("hidden");

  if (categorySelect.value === "item") {
    itemForm.classList.remove("hidden");
  }

  if (categorySelect.value === "photocard") {
    photocardForm.classList.remove("hidden");
  }
});


//submit to items
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(itemForm);
  const data = Object.fromEntries(formData.entries());

  await fetch("/api/ownedItems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  itemForm.reset();
  alert("Item added!");
});

//submit to photocards
photocardForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(photocardForm);
  const data = Object.fromEntries(formData.entries());

  await fetch("/api/ownedPhotocards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  photocardForm.reset();
  alert("Photocard added!");
});

//DELETE FROM ownedPhotocards;
//DELETE FROM sqlite_sequence WHERE name='ownedPhotocards';