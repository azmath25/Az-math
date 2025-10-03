// js/edit-problem.js
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "../js/firebase.js";

function createBlockElement(block = { type: "text", content: "" }) {
  const wrapper = document.createElement("div");
  wrapper.className = "block-item";
  if (block.type === "text") {
    wrapper.innerHTML = `<textarea class="block-text-input" placeholder="Text block">${escapeHtml(block.content || "")}</textarea>
      <button class="remove-block btn-small">Remove</button>`;
  } else if (block.type === "image") {
    wrapper.innerHTML = `<input class="block-image-input" placeholder="Image URL" value="${escapeHtml(block.url || "")}">
      <button class="remove-block btn-small">Remove</button>`;
  } else if (block.type === "problem") {
    wrapper.innerHTML = `<input class="block-problem-input" placeholder="Problem ID" value="${escapeHtml(block.problemId || "")}">
      <button class="remove-block btn-small">Remove</button>`;
  } else if (block.type === "lesson") {
    wrapper.innerHTML = `<input class="block-lesson-input" placeholder="Lesson ID" value="${escapeHtml(block.lessonId || "")}">
      <button class="remove-block btn-small">Remove</button>`;
  }
  wrapper.querySelectorAll(".remove-block").forEach(b => b.addEventListener("click", () => wrapper.remove()));
  return wrapper;
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

function renderSolutionUI(sol) {
  const container = document.createElement("div");
  container.className = "solution-editor";
  container.innerHTML = `<div class="solution-header"><strong>Solution ${sol.id}</strong> <button class="remove-solution btn-small">Remove Solution</button></div>`;
  const blocksContainer = document.createElement("div");
  blocksContainer.className = "blocks-container";
  (sol.blocks || []).forEach(b => blocksContainer.appendChild(createBlockElement(b)));
  const actions = document.createElement("div");
  actions.className = "block-actions";
  actions.innerHTML = `
    <button class="btn btn-small add-text">➕ Text</button>
    <button class="btn btn-small add-image">🖼️ Image</button>
    <button class="btn btn-small add-problem">🔗 Problem Ref</button>
  `;
  container.appendChild(blocksContainer);
  container.appendChild(actions);

  actions.querySelector(".add-text").addEventListener("click", () => blocksContainer.appendChild(createBlockElement({ type: "text", content: "" })));
  actions.querySelector(".add-image").addEventListener("click", () => blocksContainer.appendChild(createBlockElement({ type: "image", url: "" })));
  actions.querySelector(".add-problem").addEventListener("click", () => blocksContainer.appendChild(createBlockElement({ type: "problem", problemId: "" })));

  container.querySelector(".remove-solution").addEventListener("click", () => container.remove());
  return container;
}

function gatherBlocksFromContainer(container) {
  const out = [];
  container.querySelectorAll(".block-item").forEach(item => {
    if (item.querySelector(".block-text-input")) {
      out.push({ type: "text", content: item.querySelector(".block-text-input").value });
    } else if (item.querySelector(".block-image-input")) {
      out.push({ type: "image", url: item.querySelector(".block-image-input").value });
    } else if (item.querySelector(".block-problem-input")) {
      out.push({ type: "problem", problemId: item.querySelector(".block-problem-input").value });
    } else if (item.querySelector(".block-lesson-input")) {
      out.push({ type: "lesson", lessonId: item.querySelector(".block-lesson-input").value });
    }
  });
  return out;
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const problemIdInput = document.getElementById("problem-id");
  const titleInput = document.getElementById("problem-title");
  const categoryInput = document.getElementById("problem-category");
  const difficultyInput = document.getElementById("problem-difficulty");
  const tagsInput = document.getElementById("problem-tags");
  const statementBlocks = document.getElementById("statement-blocks");
  const addText = document.getElementById("add-text-statement");
  const addImage = document.getElementById("add-image-statement");
  const addProblemRef = document.getElementById("add-problem-ref-statement");
  const addLessonRef = document.getElementById("add-lesson-ref-statement");
  const solutionsContainer = document.getElementById("solutions-container");
  const addSolutionBtn = document.getElementById("add-solution-btn");
  const saveDraftBtn = document.getElementById("save-draft-btn");
  const publishBtn = document.getElementById("publish-btn");
  const previewBtn = document.getElementById("preview-btn");

  // helpers
  addText.addEventListener("click", () => statementBlocks.appendChild(createBlockElement({ type: "text", content: "" })));
  addImage.addEventListener("click", () => statementBlocks.appendChild(createBlockElement({ type: "image", url: "" })));
  addProblemRef.addEventListener("click", () => statementBlocks.appendChild(createBlockElement({ type: "problem", problemId: "" })));
  addLessonRef.addEventListener("click", () => statementBlocks.appendChild(createBlockElement({ type: "lesson", lessonId: "" })));

  addSolutionBtn.addEventListener("click", () => {
    const nextId = solutionsContainer.children.length + 1;
    solutionsContainer.appendChild(renderSolutionUI({ id: nextId, blocks: [] }));
  });

  // Load existing problem if id provided
  if (id) {
    problemIdInput.value = id;
    const snap = await getDoc(doc(db, "problems", String(id)));
    if (snap.exists()) {
      const p = snap.data();
      titleInput.value = p.title || "";
      categoryInput.value = p.category || "";
      difficultyInput.value = p.difficulty || "Easy";
      tagsInput.value = (p.tags || []).join(", ");
      statementBlocks.innerHTML = "";
      (p.statement || []).forEach(b => statementBlocks.appendChild(createBlockElement(b)));
      // solutions
      solutionsContainer.innerHTML = "";
      (p.solutions || []).forEach(s => solutionsContainer.appendChild(renderSolutionUI(s)));
      document.getElementById("lesson-refs").value = (p.lessons || []).join(", ");
    } else {
      // new empty
      statementBlocks.innerHTML = "";
      solutionsContainer.innerHTML = "";
    }
  }

  // preview
  previewBtn.addEventListener("click", () => {
    const previewMode = document.getElementById("preview-mode");
    const previewTitle = document.getElementById("preview-title");
    const previewId = document.getElementById("preview-id");
    const previewCategory = document.getElementById("preview-category");
    const previewTags = document.getElementById("preview-tags");
    const previewStatement = document.getElementById("preview-statement");
    const previewSolutions = document.getElementById("preview-solutions");

    previewTitle.textContent = titleInput.value || `Problem #${problemIdInput.value}`;
    previewId.textContent = `#${problemIdInput.value}`;
    previewCategory.textContent = categoryInput.value;
    previewTags.innerHTML = "";
    tagsInput.value.split(",").map(t => t.trim()).filter(Boolean).forEach(t => previewTags.insertAdjacentHTML("beforeend", `<span class="tag">${t}</span>`));
    previewStatement.innerHTML = "";
    gatherBlocksFromContainer(statementBlocks).forEach(b => {
      if (b.type === "text") previewStatement.insertAdjacentHTML("beforeend", `<div class="block-text">${escapeHtml(b.content)}</div>`);
      if (b.type === "image") previewStatement.insertAdjacentHTML("beforeend", `<div class="block-image"><img src="${escapeHtml(b.url)}" style="max-width:100%"/></div>`);
    });
    previewSolutions.innerHTML = "";
    Array.from(solutionsContainer.children).forEach((solEl, idx) => {
      const blocksContainer = solEl.querySelector(".blocks-container");
      const solBlocks = gatherBlocksFromContainer(blocksContainer);
      const solWrap = document.createElement("div");
      solWrap.innerHTML = `<h4>Solution ${idx + 1}</h4>`;
      solBlocks.forEach(b => {
        if (b.type === "text") solWrap.insertAdjacentHTML("beforeend", `<div class="block-text">${escapeHtml(b.content)}</div>`);
        if (b.type === "image") solWrap.insertAdjacentHTML("beforeend", `<div class="block-image"><img src="${escapeHtml(b.url)}" style="max-width:100%"/></div>`);
      });
      previewSolutions.appendChild(solWrap);
    });
    document.getElementById("editor-form").style.display = "none";
    previewMode.style.display = "block";
  });

  // save helper
  async function saveProblem(publish = false) {
    const pid = problemIdInput.value || null;
    if (!pid) return alert("Problem ID missing");
    const docRef = doc(db, "problems", String(pid));
    const payload = {
      id: Number(pid),
      title: titleInput.value || null,
      category: categoryInput.value || "",
      difficulty: difficultyInput.value || "",
      tags: tagsInput.value.split(",").map(t => t.trim()).filter(Boolean),
      draft: !publish,
      statement: gatherBlocksFromContainer(statementBlocks),
      solutions: Array.from(solutionsContainer.children).map((solEl, idx) => {
        const blocksContainer = solEl.querySelector(".blocks-container");
        return {
          id: idx + 1,
          blocks: gatherBlocksFromContainer(blocksContainer)
        };
      }),
      lessons: (document.getElementById("lesson-refs").value || "").split(",").map(x => x.trim()).filter(Boolean).map(x => Number(x)),
      author: "admin",
      timestamp: serverTimestamp()
    };
    try {
      await setDoc(docRef, payload, { merge: true });
      alert(publish ? "Published" : "Saved as draft");
      if (publish) location.href = "problems.html";
    } catch (err) {
      console.error(err);
      alert("Save failed: " + err.message);
    }
  }

  saveDraftBtn.addEventListener("click", async () => saveProblem(false));
  publishBtn.addEventListener("click", async () => saveProblem(true));
});
