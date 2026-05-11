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
      <p><b>C Key:</b> Open comment field</p>
      <p><b>Enter:</b> Submit comment</p>
      <p><b>Esc:</b> Close comment field</p>
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

  // Find the Like SVG directly
  const icon = post.querySelector(
    'svg[aria-label="Like"], svg[aria-label="like"], svg[aria-label="Unlike"], svg[aria-label="unlike"]'
  );

  if (!icon) {
    console.log("Like icon not found");
    return;
  }

  // Trigger realistic mouse events directly on the SVG
  ["mousedown", "mouseup", "click"].forEach((type) => {
    icon.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  });

  // Visual feedback
  const originalOutline = post.style.outline;
  post.style.outline = "5px solid white";

  setTimeout(() => {
    post.style.outline = originalOutline;
  }, 200);
}

// Find the textarea belonging to the current post (falls back to any textarea)
function findCommentTextarea(post) {
  return (post && post.querySelector('textarea')) || document.querySelector('textarea');
}

function findActiveCommentTextarea() {
  const textareas = Array.from(document.querySelectorAll("textarea"));

  return textareas.find(t => {
    const style = window.getComputedStyle(t);

    return (
      t.offsetParent !== null &&              // visible in layout
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      t.getBoundingClientRect().height > 0
    );
  }) || null;
}

// Poll briefly until the comment textarea is mounted and successfully focused
function focusCommentTextarea() {
  let attempts = 0;
  const maxAttempts = 50;

  const tryFocus = () => {
    const textarea = findActiveCommentTextarea();

    if (textarea) {
      textarea.scrollIntoView({ block: "center" });

      textarea.click();

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange?.(
          textarea.value.length,
          textarea.value.length
        );
      });

      if (document.activeElement === textarea) return;
    }

    if (++attempts < maxAttempts) {
      setTimeout(tryFocus, 50);
    }
  };

  tryFocus();
}

// Open the comment section of the current post and focus its textarea
function openCommentSection() {
  const posts = getPosts();
  const post = posts[getCurrentPostIndex()];
  if (!post) return;

  const commentIcon = post.querySelector(
    'svg[aria-label="Comment"], svg[aria-label="comment"]'
  );

  if (commentIcon) {
    ["mousedown", "mouseup", "click"].forEach((type) => {
      commentIcon.dispatchEvent(
        new MouseEvent(type, { bubbles: true, cancelable: true, view: window })
      );
    });
  }

  setTimeout(() => focusCommentTextarea(), 120);
}

// Submit the comment that is currently being typed
function submitFocusedComment() {
  const textarea = document.activeElement;
  if (!textarea || textarea.tagName !== "TEXTAREA") return;

  const form = textarea.closest("form");
  let submitBtn = form && form.querySelector('button[type="submit"]');

  if (!submitBtn) {
    const scope = textarea.closest("article") || document;
    submitBtn = Array.from(scope.querySelectorAll('div[role="button"], button'))
      .find(b => /^(post|posten|publish|veröffentlichen)$/i.test(b.textContent.trim()));
  }

  if (submitBtn && !submitBtn.disabled) {
    submitBtn.click();
    setTimeout(() => textarea.blur(), 50);
  }
}

// Close / unfocus the comment section
function closeCommentSection() {
  const active = document.activeElement;
  if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
    active.blur();
  }
}

// Keyboard controls
document.addEventListener("keydown", e => {
  const active = document.activeElement;
  const inTextField = active && ["INPUT", "TEXTAREA"].includes(active.tagName);

  // When typing a comment, only Enter (submit) and Escape (close) are handled.
  if (inTextField) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      submitFocusedComment();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeCommentSection();
    }
    return;
  }

  if (isScrolling) return;
  if (e.repeat) return;

  const posts = getPosts();
  if (!posts.length) return;

  const currentIndex = getCurrentPostIndex();

  if (e.key === "ArrowDown") {
    e.preventDefault();
    focusPost(Math.min(currentIndex + 1, posts.length - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    focusPost(Math.max(currentIndex - 1, 0));
  } else if (e.key.toLowerCase() === "x") {
    e.preventDefault();
    likeCurrentPost();
  } else if (e.key.toLowerCase() === "c") {
    e.preventDefault();
    openCommentSection();
  } else if (e.key === "Escape") {
    e.preventDefault();
    closeCommentSection();
  }
});

// Persistent shortcuts HUD in the bottom-right corner
function showShortcutsHud() {
  if (document.getElementById("instakeys-hud")) return;

  const hud = document.createElement("div");
  hud.id = "instakeys-hud";
  hud.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: rgba(20, 20, 20, 0.92); color: #fff;
    padding: 12px 14px; border-radius: 10px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 12px; line-height: 1.55;
    z-index: 9999; box-shadow: 0 6px 18px rgba(0,0,0,0.55);
    user-select: none; pointer-events: auto;
    min-width: 180px; backdrop-filter: blur(4px);
  `;

  const kbd = `display:inline-block; min-width:18px; padding:1px 6px;
    margin-right:8px; background:#2a2a2a; border:1px solid #444;
    border-radius:4px; font-family:Menlo,Consolas,monospace;
    font-size:11px; text-align:center; color:#fff;`;

  const row = (key, label) =>
    `<div style="display:flex; align-items:center; margin:2px 0;">
       <span style="${kbd}">${key}</span><span>${label}</span>
     </div>`;

  hud.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;
                margin-bottom:6px; font-weight:600; color:#ff5a5a;">
      <span>InstaKeys Shortcuts</span>
      <span id="instakeys-hud-toggle" style="cursor:pointer; color:#aaa;
            font-size:14px; padding:0 4px;">–</span>
    </div>
    <div id="instakeys-hud-body">
      ${row("↑ ↓", "Next / Previous post")}
      ${row("X", "Like / Unlike post")}
      ${row("C", "Open comment field")}
      ${row("⏎", "Submit comment")}
      ${row("Esc", "Close comment field")}
    </div>
  `;

  document.body.appendChild(hud);

  const body = hud.querySelector("#instakeys-hud-body");
  const toggle = hud.querySelector("#instakeys-hud-toggle");
  toggle.addEventListener("click", () => {
    const hidden = body.style.display === "none";
    body.style.display = hidden ? "" : "none";
    toggle.textContent = hidden ? "–" : "+";
  });
}

// INITIALISIERUNG
setTimeout(() => {
  showOnboarding();
  showShortcutsHud();
  focusPost(getCurrentPostIndex());
}, 2000);

// Keep HUD alive across Instagram's SPA route changes
setInterval(showShortcutsHud, 3000);
