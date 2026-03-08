let isScrolling = false;

// --- ONBOARDING OVERLAY FUNKTION ---
function showOnboarding() {
  if (localStorage.getItem("addon_onboarding_done")) return;

  const overlay = document.createElement('div');
  overlay.id = "scroll-onboarding";
  overlay.style = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #1a1a1a; color: white; padding: 25px; border-radius: 15px;
    border: 2px solid red; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    z-index: 10000; box-shadow: 0 10px 30px rgba(0,0,0,0.8); text-align: center;
    min-width: 300px;
  `;
  
  overlay.innerHTML = `
    <h2 style="margin-top:0; color: red;">Controls Active!</h2>
    <p>Use your keyboard to navigate:</p>
    <div style="text-align: left; background: #222; padding: 10px; border-radius: 8px; margin: 15px 0;">
      <p><b>↑ / ↓ Arrows:</b> Next / Previous post</p>
      <p><b>X Key:</b> Like / Unlike post</p>
    </div>
    <button id="close-onboarding" style="
      background: red; color: white; border: none; padding: 10px 20px; 
      border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%;
    ">Got it!</button>
  `;

  document.body.appendChild(overlay);

  document.getElementById('close-onboarding').onclick = () => {
    overlay.remove();
    localStorage.setItem("addon_onboarding_done", "true");
    focusPost(getCurrentPostIndex()); // Starts immediately
  };
}

// Get all visible posts
function getPosts() {
  return Array.from(document.querySelectorAll("article")).filter(post =>
    post.offsetParent !== null
  );
}

// Find the post closest to screen center
function getCurrentPostIndex() {
  const posts = getPosts();
  const centerY = window.innerHeight / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  posts.forEach((post, index) => {
    const rect = post.getBoundingClientRect();
    const postCenter = rect.top + rect.height / 2;
    const distance = Math.abs(centerY - postCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

// Scroll to a post safely
function focusPost(index) {
  const posts = getPosts();
  if (!posts[index]) return;

  isScrolling = true;

  posts[index].scrollIntoView({ behavior: "smooth", block: "center" });

  // Rahmen-Highlighting
  posts.forEach(p => (p.style.outline = ""));
  posts[index].style.outline = "3px solid red";
  posts[index].style.outlineOffset = "-3px";

  setTimeout(() => {
    isScrolling = false;
  }, 500);
}

// Like current post
function likeCurrentPost() {
  const posts = getPosts();
  const index = getCurrentPostIndex();
  const post = posts[index];
  if (!post) return;

  const icon = post.querySelector(
    'svg[aria-label="Like"], svg[aria-label="like"], svg[aria-label="Unlike"], svg[aria-label="unlike"]'
  );

  if (!icon) return;
  const button = icon.closest("button");

  if (button) {
    button.click();
    // Kleiner visueller Effekt beim Like
    const originalOutline = post.style.outline;
    post.style.outline = "5px solid white";
    setTimeout(() => post.style.outline = originalOutline, 200);
  }
}

// Keyboard controls
document.addEventListener("keydown", e => {
  if (isScrolling) return;
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (e.repeat) return;

  const posts = getPosts();
  if (!posts.length) return;

  const currentIndex = getCurrentPostIndex();

  if (e.key === "ArrowDown") {
    e.preventDefault();
    focusPost(Math.min(currentIndex + 1, posts.length - 1));
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    focusPost(Math.max(currentIndex - 1, 0));
  }

  if (e.key.toLowerCase() === "x") {
    e.preventDefault();
    likeCurrentPost();
  }
});

// INITIALISIERUNG
setTimeout(() => {
  showOnboarding();
  focusPost(getCurrentPostIndex());
}, 2000);
