document.addEventListener("DOMContentLoaded", () => {
  const songContainer = document.getElementById("featured-songs");

  fetch("songs.json")
    .then(response => response.json())
    .then(data => {
      data.featuredSongs.forEach(song => {
        const songCard = document.createElement("div");
        songCard.classList.add("song-card");

        songCard.innerHTML = `
          <img src="${song.cover}" alt="${song.title}" class="song-cover">
          <h3>${song.title}</h3>
          <p>${song.artist}</p>
        `;

        songContainer.appendChild(songCard);
      });
    })
    .catch(error => console.error("Error loading songs:", error));
});
