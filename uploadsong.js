class Song {
  constructor({ id, title, artist, genre, description, coverDataURL, audioDataURL, createdAt }) {
    this.id = id || Song.generateId();
    this.title = title || "Untitled";
    this.artist = artist || "Unknown";
    this.genre = genre || "";
    this.description = description || "";
    this.cover = coverDataURL || null;   // dataURL string for image
    this.audio = audioDataURL || null;   // dataURL string for audio
    this.createdAt = createdAt || Date.now();
  }

  // Render the song as a DOM element (card)
  render() {
    const wrap = document.createElement("article");
    wrap.className = "upload-song-card";
    wrap.setAttribute("data-id", this.id);

    // card inner HTML
    wrap.innerHTML = `
      <div class="usc-left">
        <div class="usc-thumb">
          ${this.cover ? `<img src="${this.cover}" alt="${this.title} cover">` : `<div class="no-thumb">No cover</div>`}
        </div>
      </div>
      <div class="usc-mid">
        <h4 class="usc-title">${escapeHtml(this.title)}</h4>
        <div class="usc-meta"><strong>${escapeHtml(this.artist)}</strong> • ${escapeHtml(this.genre)}</div>
        <p class="usc-desc">${escapeHtml(this.description)}</p>
        ${this.audio ? `<audio controls preload="none" src="${this.audio}" class="usc-player"></audio>` : `<div class="text-muted">No audio attached</div>`}
      </div>
      <div class="usc-actions">
        <button class="btn small btn-delete" title="Delete">Delete</button>
      </div>
    `;

    // delete button handler (delegated by manager will attach)
    return wrap;
  }

  // static id generator
  static generateId() {
    return "s_" + Math.random().toString(36).slice(2, 10);
  }
}


// Manager to hold songs, persist to localStorage, render to UI
class SongManager {
  constructor(storageKey = "songverse_songs") {
    this.storageKey = storageKey;
    this.songs = [];
    this.container = document.getElementById("uploaded-list"); // container in HTML
    if (!this.container) {
      console.warn("uploadsong.js: #uploaded-list container not found.");
    }
    this.load();
    this.renderAll();
    this.attachDeleteHandler();
  }

  // load from localStorage
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.songs = parsed.map(obj => new Song(obj));
      }
    } catch (err) {
      console.error("Failed to load songs from localStorage:", err);
    }
  }

  // save to localStorage
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.songs));
    } catch (err) {
      console.error("Failed to save songs to localStorage:", err);
    }
  }

  // add song from an object
  addSongObj(obj) {
    const song = new Song(obj);
    this.songs.unshift(song); // newest first
    this.save();
    this.renderAll();
    return song;
  }

  // add song from form files (uses FileReader, returns a Promise)
  async addFromForm(formElement) {
    // collect fields
    const title = (formElement.querySelector('input[name="title"]') || formElement.querySelector('input[type="text"]')).value.trim();
    const artist = (formElement.querySelector('input[name="artist"]') || formElement.querySelectorAll('input')[1]).value.trim();
    const genre = (formElement.querySelector('input[name="genre"]') || formElement.querySelectorAll('input')[2]) ? (formElement.querySelector('input[name="genre"]') || formElement.querySelectorAll('input')[2]).value.trim() : "";
    const description = (formElement.querySelector('textarea') && formElement.querySelector('textarea').value.trim()) || "";

    // basic validation
    if (!title) throw new Error("Please enter a song title.");
    if (!artist) throw new Error("Please enter the artist name.");

    // files
    const coverFile = formElement.querySelector('input[type="file"][accept^="image"]') ? formElement.querySelector('input[type="file"][accept^="image"]').files[0] : null;
    const audioFile = formElement.querySelector('input[type="file"][accept^="audio"]') ? formElement.querySelector('input[type="file"][accept^="audio"]').files[0] : null;

    // helpers to read file as dataURL (returns Promise)
    function readAsDataURL(file) {
      return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
    }

    // read files (image + audio)
    const [coverDataURL, audioDataURL] = await Promise.all([
      readAsDataURL(coverFile),
      readAsDataURL(audioFile)
    ]);

    // create and add
    const created = this.addSongObj({
      title, artist, genre, description,
      coverDataURL, audioDataURL,
      createdAt: Date.now()
    });

    return created;
  }

  // remove by id
  removeById(id) {
    const idx = this.songs.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.songs.splice(idx, 1);
      this.save();
      this.renderAll();
      return true;
    }
    return false;
  }

  // render all songs
  renderAll() {
    if (!this.container) return;
    this.container.innerHTML = "";
    if (this.songs.length === 0) {
      this.container.innerHTML = `<div class="no-items center text-muted">No uploaded songs yet. Use the form to add one.</div>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    this.songs.forEach(song => {
      const el = song.render();
      fragment.appendChild(el);
    });
    this.container.appendChild(fragment);
  }

  // delegated delete handler for speed
  attachDeleteHandler() {
    if (!this.container) return;
    this.container.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-delete");
      if (!btn) return;
      const card = btn.closest("[data-id]");
      if (!card) return;
      const id = card.getAttribute("data-id");
      if (confirm("Delete this uploaded song?")) {
        this.removeById(id);
      }
    });
  }
}


// Utility: escape HTML to avoid injection when rendering strings
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// Initialize manager and wire form
document.addEventListener("DOMContentLoaded", () => {
  const manager = new SongManager();

  // form presence
  const form = document.querySelector(".upload-card form");
  if (!form) {
    console.warn("uploadsong.js: upload form not found.");
    return;
  }

  // enhance: set name attributes if not present (safer selectors)
  form.querySelectorAll("input, textarea").forEach((el, i) => {
    if (!el.name) {
      if (el.type === "file") {
        // set file names by accept attribute
        if (el.accept && el.accept.startsWith("image")) el.name = "cover";
        else if (el.accept && el.accept.startsWith("audio")) el.name = "audio";
        else el.name = "file" + i;
      } else {
        el.name = el.placeholder ? el.placeholder.toLowerCase().split(" ")[0] : "field" + i;
      }
    }
  });

  // submit handler
  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    try {
      // disable submit while processing
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading...";
      }

      const created = await manager.addFromForm(form);
      // small success feedback
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "UPLOAD NOW";
      }

      // reset form but keep last values if you want — here we reset everything
      form.reset();

      // scroll to the uploaded item
      const el = document.querySelector(`[data-id="${created.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // highlight that card briefly
        el.style.boxShadow = "0 12px 40px rgba(43,122,203,0.18)";
        setTimeout(() => el.style.boxShadow = "", 1600);
      }
    } catch (err) {
      alert(err.message || "Failed to upload song. Check console.");
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "UPLOAD NOW";
      }
      console.error(err);
    }
  });
});
