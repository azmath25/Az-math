// js/main.js
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  const profileImg = document.getElementById("profile-photo");
  if (profileImg && !profileImg.src) {
    profileImg.src = "assets/img/defaultprofile.png";
  }
});
