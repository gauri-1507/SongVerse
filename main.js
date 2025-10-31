// main.js — mobile nav toggle and small form checks
document.addEventListener("DOMContentLoaded", function() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      if (links) {
        links.style.display = expanded ? "none" : "flex";
        links.style.flexDirection = "column";
        links.style.position = "absolute";
        links.style.right = "18px";
        links.style.top = "66px";
        links.style.background = "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))";
        links.style.padding = "12px";
        links.style.borderRadius = "10px";
        links.style.boxShadow = "0 8px 22px rgba(10,30,50,0.08)";
      }
    });
  }

  const uploadForm = document.querySelector(".upload-card form");
  if (uploadForm) {
    uploadForm.addEventListener("submit", (e) => {
      const title = uploadForm.querySelector('input[type="text"]');
      if (title && title.value.trim() === "") {
        e.preventDefault();
        alert("Please enter a song title.");
        title.focus();
      }
    });
  }
});
