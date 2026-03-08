let isScrolling = false;

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

  posts.forEach(p => (p.style.outline = ""));
  posts[index].style.outline = "3px solid red";

  // Unlock after scroll settles
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

  // Find Like OR Unlike icon
  const icon = post.querySelector(
    'svg[aria-label="Like"], svg[aria-label="like"], svg[aria-label="Unlike"], svg[aria-label="unlike"]'
  );

  if (!icon) {
    console.log("⚠️ No like/unlike icon found");
    return;
  }

  const button = icon.closest("button");

  if (button) {
    button.click();

    const label = icon.getAttribute("aria-label");
    if (label.toLowerCase() === "like") {
      console.log("❤️ Liked post");
    } else {
      console.log("💔 Unliked post");
    }

  } else if (icon.parentElement) {
    icon.parentElement.click();
    console.log("🔁 Toggled like via parent element");
  }
}

// Keyboard controls
document.addEventListener("keydown", e => {
  if (isScrolling) return;

  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

  if (e.repeat) return; // prevent key hold spam

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

// Start at current visible post
setTimeout(() => {
  focusPost(getCurrentPostIndex());
}, 2000);