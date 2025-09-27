function toggleMenu() { document.getElementById("navLinks").classList.toggle("show"); }
async function loadMainInfo() { const res = await fetch("data/main-info.json"); const data = await res.json(); const container = document.getElementById("main-content"); data.forEach(section => { const h = document.createElement("h2"); h.textContent = section.header; const p = document.createElement("p"); p.textContent = section.text; container.appendChild(h); container.appendChild(p); }); }
document.addEventListener("DOMContentLoaded", loadMainInfo);
