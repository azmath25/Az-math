// js/edit-lesson.js
import { db, doc, getDoc, setDoc, serverTimestamp } from "../js/firebase.js";

function createBlockElement(block = { type: "text", content: "" }) {
  const wrapper = document.createElement("div");
  wrapper.className = "block-item";
  if (block.type === "text") {
    wrapper.innerHTML = `<textarea class="block-text-input" placeholder="Text block">${block.content || ""}</textarea><button class="remove-block btn-small">Remove</button>`;
  } else if (block.type === "image") {
    wrapper.innerHTML = `<input class="block-image-input" placeholder="Image URL" value="${block.url || ""}"><button class="remove-block btn-small">Remove</button>`;
  } else if (block.type === "problem") {
    wrapper.innerHTML = `<input class="block-problem-input" placeholder="Problem ID" value="${block.problemId || ""}"><button class="remove-block btn-small">Remove</button>`;
  }
  wrapper.querySelectorAll(".remove-block").forEach(b => b.addEventListener("click", () => wrapper.remove()));
  return wrapper;
}

function gatherBlocks(container) {
  const out = [];
  container.querySelectorAll(".block-item").forEach(item => {
    if (item.querySelector(".block-text-input")) out.push({ type: "text", content: item.querySelector(".block-text-input").value });
    else if (item.querySelector(".block-image-input")) out.push({ type: "image", url: item.querySelector(".block-image-input").value });
    else if (item.querySelector(".block-problem-input")) out.push({ type: "problem", problemId: item.querySelector(".block-problem-input").value });
  });
  return out;
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const lessonIdInput = document.getElementById("lesson-id");
  const titleInput = document.getElementById("lesson-title");
  const categoryInput = document.getElementById("lesson-category");
  const tagsInput = document.getElementById("lesson-tags");
  const coverInput = document.getElementById("lesson-cover");
  const blocksContainer = document.getElementById("content-blocks");
  const addText = document.getElementById("add-text-block");
  const addImage = document.getElementById("add-image-block");
  const addProblemRef = document.getElementById("add-problem-ref");
  const saveDraftBtn = document.getElementById("save-draft-btn");
  const publishBtn = document.getElementById("publish-btn");
  const previewBtn = document.getElementById("preview-btn");

  addText.addEventListener("click", () => blocksContainer.appendChild(createBlockElement({ type: "text", content: "" })));
  addImage.addEventListener("click", () => blocksContainer.appendChild(createBlockElement({ type: "image", url: "" })));
  addProblemRef.addEventListener("click", () => blocksContainer.appendChild(createBlockElement({ type: "problem", problemId: "" })));

  if (id) {
    lessonIdInput.value = id;
    const snap = await getDoc(doc(db, "lessons", String(id)));
    if (snap.exists()) {
      const L = snap.data();
      titleInput.value = L.title || "";
      categoryInput.value = L.category || "";
      tagsInput.value = (L.tags || []).join(", ");
      coverInput.value = L.cover || "";
      blocksContainer.innerHTML = "";
      (L.blocks || []).forEach(b => blocksContainer.appendChild(createBlockElement(b)));
    }
  }

  function gather() {
    return {
      id: lessonIdInput.value,
      title: titleInput.value,
      category: categoryInput.value,
      tags: tagsInput.value.split(",").map(t => t.trim()).filter(Boolean),
      cover: coverInput.value,
      blocks: gatherBlocks(blocksContainer),
      timestamp: serverTimestamp()
    };
  }

  saveDraftBtn.addEventListener("click", async () => {
    const payload = gather(); payload.draft = true;
    await setDoc(doc(db, "lessons", String(payload.id)), payload, { merge: true });
    alert("Saved as draft");
  });
  publishBtn.addEventListener("click", async () => {
    const payload = gather(); payload.draft = false;
    await setDoc(doc(db, "lessons", String(payload.id)), payload, { merge: true });
    alert("Published");
    location.href = "lessons.html";
  });

  previewBtn.addEventListener("click", () => {
    document.getElementById("editor-form").style.display = "none";
    document.getElementById("preview-mode").style.display = "block";
    document.getElementById("preview-title").textContent = titleInput.value;
    document.getElementById("preview-id").textContent = `#${lessonIdInput.value}`;
    document.getElementById("preview-category").textContent = categoryInput.value;
    const previewTags = document.getElementById("preview-tags");
    previewTags.innerHTML = "";
    (tagsInput.value.split(",").map(t=>t.trim()).filter(Boolean)).forEach(t => previewTags.insertAdjacentHTML("beforeend", `<span class="tag">${t}</span>`));
    const previewContent = document.getElementById("preview-content");
    previewContent.innerHTML = "";
    gatherBlocks(blocksContainer).forEach(b => {
      if (b.type === "text") previewContent.insertAdjacentHTML("beforeend", `<div class="block-text">${b.content}</div>`);
      if (b.type === "image") previewContent.insertAdjacentHTML("beforeend", `<div class="block-image"><img src="${b.url}" style="max-width:100%"/></div>`);
      if (b.type === "problem") previewContent.insertAdjacentHTML("beforeend", `<div class="block-ref"><a href="../problem.html?id=${b.problemId}">Problem ${b.problemId}</a></div>`);
    });
  });
});
