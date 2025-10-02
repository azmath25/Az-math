// js/menu.js
const root = document.getElementById("menu");
root.innerHTML = `
  <nav class="menu" role="navigation">
    <div class="menu-left">
      <button id="hamburger" aria-label="menu">☰</button>
      <button onclick="location.href='index.html'">Home</button>
      <button onclick="location.href='problem.html'">Problems</button>
      <button onclick="location.href='lessons.html'">Lessons</button>
      <button onclick="location.href='admin.html'">Admin</button>
    </div>
    <div class="menu-right">
      <img id="profileIcon" src="images/profile.png" alt="profile" class="profile-icon" />
    </div>
  </nav>
`;

document.getElementById("hamburger").addEventListener("click", () => {
  // Simple ARIA toggle -- expands/collapses menu links on small screens if you add CSS
  // For now we just toggle a class on the menu for further styling if needed
  document.querySelector(".menu").classList.toggle("open");
});

