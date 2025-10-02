// Get lesson ID from URL
function getLessonId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Mock lesson data (later replace with Firebase)
const lessons = {
  "1": {
    title: "Introduction to Algebra",
    content: `
      <p>Algebra is the study of symbols and rules for manipulating them.</p>
      <img src="https://via.placeholder.com/400x200" alt="Lesson image">
    `,
    problems: [101, 102, 103]
  },
  "2": {
    title: "Geometry Basics",
    content: `
      <p>Geometry deals with shapes, sizes, and the properties of space.</p>
      <img src="https://via.placeholder.com/400x200" alt="Lesson image">
    `,
    problems: [201, 202]
  }
};

// Render lesson
function renderLesson() {
  const id = getLessonId();
  const lesson = lessons[id];

  if (!lesson) {
    document.getElementById("lesson-title").innerText = "Lesson not found";
    return;
  }

  document.getElementById("lesson-title").innerText = lesson.title;
  document.getElementById("lesson-content").innerHTML = lesson.content;

  const problemList = document.getElementById("lesson-problems");
  lesson.problems.forEach(pid => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="problem.html?id=${pid}">Problem ${pid}</a>`;
    problemList.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", renderLesson);
