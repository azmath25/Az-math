// js/menu.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("menu");
  if (!container) return;
  container.innerHTML = `
    <div class="top-menu">
      <a href="index.html">Home</a> ·
      <a href="problems.html">Problems</a> ·
      <a href="lessons.html">Lessons</a> ·
      <a href="profile.html">Profile</a>
    </div>
  `;
});
