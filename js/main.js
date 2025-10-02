// Handle mobile menu toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const menuLinks = document.querySelector(".menu-links");

  if (toggle && menuLinks) {
    toggle.addEventListener("click", () => {
      menuLinks.classList.toggle("show");
    });
  }

  // Default profile photo handling
  const profileImg = document.getElementById("profile-img");
  if (profileImg) {
    profileImg.onerror = () => {
      profileImg.src = "assets/defaultprofile.png";
    };
  }
});
