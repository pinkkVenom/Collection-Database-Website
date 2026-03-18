// -------------------------
//handles login form submission page
// -------------------------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    })
  });

  if (res.ok) {
    window.location.href = "/index.html";
  } else {
    alert("Login failed");
  }
});
