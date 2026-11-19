(function () {
  "use strict";

  window.SBHG = window.SBHG || {};

  function initMenu() {
    const menu = document.getElementById("SBHG-menu");
    const trigger = document.querySelector(".SBHG-menu-trigger");
    const closeButton = document.querySelector(".SBHG-menu-close");
    const mobile = window.matchMedia("(max-width: 767px)");

    if (!menu || !trigger || !closeButton) {
      return;
    }

    let opened = false;
    let previousFocus = null;
    const previousInert = new Map();

    function focusableElements() {
      return Array.from(
        menu.querySelectorAll(
          'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (element) {
        return !element.hidden && element.getClientRects().length > 0;
      });
    }

    function setBackgroundInert(enabled) {
      const regions = [
        document.getElementById("main"),
        document.getElementById("footer"),
        document.querySelector(".SBHG-progress"),
        document.querySelector(".SBHG-nav"),
        document.querySelector(".SBHG-skip")
      ].filter(Boolean);

      regions.forEach(function (region) {
        if (enabled) {
          previousInert.set(region, region.hasAttribute("inert"));
          region.setAttribute("inert", "");
        } else if (!previousInert.get(region)) {
          region.removeAttribute("inert");
        }
      });

      if (!enabled) {
        previousInert.clear();
      }
    }

    function openMenu() {
      if (opened || !mobile.matches) {
        return;
      }

      opened = true;
      previousFocus = document.activeElement;

      menu.hidden = false;
      menu.setAttribute("role", "dialog");
      menu.setAttribute("aria-modal", "true");
      menu.setAttribute("aria-label", "Navigation");

      trigger.setAttribute("aria-expanded", "true");
      setBackgroundInert(true);
      closeButton.focus();

      /*
        Deliberately no body overflow change: the native scrollbar and
        underlying page scroll remain available.
      */
    }

    function closeMenu(restoreFocus) {
      if (!opened) {
        return;
      }

      opened = false;
      menu.hidden = true;
      menu.removeAttribute("role");
      menu.removeAttribute("aria-modal");
      menu.removeAttribute("aria-label");

      trigger.setAttribute("aria-expanded", "false");
      setBackgroundInert(false);

      if (
        restoreFocus !== false &&
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    }

    trigger.hidden = !mobile.matches;

    trigger.addEventListener("click", function () {
      if (opened) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    closeButton.addEventListener("click", function () {
      closeMenu();
    });

    menu.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const elements = focusableElements();

      if (!elements.length) {
        event.preventDefault();
        closeButton.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    menu.addEventListener("click", function (event) {
      if (!(event.target instanceof Element)) {
        return;
      }

      const link = event.target.closest('a[href^="#"]');

      if (!link) {
        return;
      }

      const target = document.querySelector(link.getAttribute("href"));

      closeMenu(false);

      if (target) {
        const heading = target.querySelector("h1, h2");

        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });

          heading.addEventListener("blur", function () {
            heading.removeAttribute("tabindex");
          }, { once: true });
        }
      }
    });

    mobile.addEventListener("change", function () {
      trigger.hidden = !mobile.matches;

      if (!mobile.matches) {
        closeMenu(false);
      }
    });
  }

  function initProducts() {
    const dialog = document.getElementById("SBHG-product-dialog");
    const title = document.getElementById("SBHG-dialog-title");

    if (!dialog || !title) {
      return;
    }

    let opener = null;

    document.addEventListener("click", function (event) {
      if (!(event.target instanceof Element)) {
        return;
      }

      const button = event.target.closest("[data-view]");

      if (!button) {
        return;
      }

      const number = button.getAttribute("data-view");

      if (!/^(01|02|03|04|05|06)$/.test(number)) {
        return;
      }

      opener = button;

      const tile = button.closest("[data-tile]");
      const nameField = document.getElementById("SBHG-dialog-name");
      const priceField = document.getElementById("SBHG-dialog-price");
      const conditionField = document.getElementById("SBHG-dialog-condition");
      const photo = document.getElementById("SBHG-dialog-image");
      const photoBack = document.getElementById("SBHG-dialog-image-back");
      const cta = document.getElementById("SBHG-dialog-cta");

      title.textContent = "ITEM " + number;

      if (tile) {
        const name = tile.getAttribute("data-name") || "SBHG";
        const front = tile.getAttribute("data-image");
        const back = tile.getAttribute("data-image-back");

        if (nameField) {
          nameField.textContent = name;
        }

        if (priceField) {
          const price = tile.getAttribute("data-price") || "";
          const was = tile.getAttribute("data-price-was");
          priceField.textContent = was ? price + " (was " + was + ")" : price;
        }

        if (conditionField) {
          conditionField.textContent = tile.getAttribute("data-condition") || "";
        }

        if (photo && front) {
          photo.src = front;
          photo.alt = name + ", front";
        }

        if (photoBack) {
          if (back) {
            photoBack.src = back;
            photoBack.alt = name + ", back";
            photoBack.hidden = false;
          } else {
            photoBack.hidden = true;
          }
        }

        if (cta) {
          cta.href = tile.getAttribute("data-url") ||
            "https://www.carousell.ph/u/brgy.sbhg";
        }
      }

      /*
        A nonmodal native dialog preserves the page's native scrolling.
        Product content remains explicitly placeholder content.
      */
      if (typeof dialog.show === "function") {
        if (!dialog.open) {
          dialog.show();
        }
      } else {
        dialog.setAttribute("open", "");
      }

      const close = dialog.querySelector('button[value="close"]');

      if (close) {
        close.focus({ preventScroll: true });
      }
    });

    function restoreFocus() {
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    }

    dialog.addEventListener("close", restoreFocus);

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
          restoreFocus();
        }
      }
    });

    const closeForm = dialog.querySelector('form[method="dialog"]');

    if (closeForm) {
      closeForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
          restoreFocus();
        }
      });
    }
  }

  /*
    Collection gallery: horizontal swipe with dots. No scroll choreography —
    the row is a native scroller, the dots (and arrow keys) move it, and the
    active dot grows into a pill.
  */
  function initGallery() {
    const scroller = document.querySelector(".SBHG-collection-window");
    const row = document.getElementById("SBHG-collection-row");
    const dots = Array.from(document.querySelectorAll(".SBHG-dot"));

    if (!scroller || !row || !dots.length) {
      return;
    }

    const tiles = Array.from(row.querySelectorAll(".SBHG-product"));
    let timer = 0;
    let dragging = false;
    let dragged = false;
    let startX = 0;
    let startLeft = 0;

    function nearestIndex() {
      /* Rect-based: offsets ignore scroll-padding and snapping. */
      const base = scroller.getBoundingClientRect().left;
      let best = 0;
      let bestDistance = Infinity;

      tiles.forEach(function (tile, index) {
        const distance = Math.abs(tile.getBoundingClientRect().left - base);

        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });

      return best;
    }

    function syncDots() {
      const active = nearestIndex();

      dots.forEach(function (dot, index) {
        const on = index === active;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-current", on ? "true" : "false");
      });
    }

    function moveTo(index) {
      const tile = tiles[index];

      if (!tile) {
        return;
      }

      const delta = tile.offsetLeft - row.offsetLeft - scroller.scrollLeft;
      scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: "smooth" });
    }

    /* Timer, not rAF: frames are throttled in background tabs. */
    function scheduleSync() {
      if (timer) {
        return;
      }

      timer = window.setTimeout(function () {
        timer = 0;
        syncDots();
      }, 80);
    }

    scroller.addEventListener("scroll", scheduleSync, { passive: true });

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        moveTo(index);
      });
    });

    scroller.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = Math.min(tiles.length - 1, Math.max(0, nearestIndex() + step));
      moveTo(next);
    });

    /* Pointer drag for mouse users; touch already scrolls natively. */
    scroller.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse") {
        return;
      }

      dragging = true;
      dragged = false;
      startX = event.clientX;
      startLeft = scroller.scrollLeft;
      scroller.classList.add("is-dragging");
      scroller.setPointerCapture(event.pointerId);
    });

    scroller.addEventListener("pointermove", function (event) {
      if (!dragging) {
        return;
      }

      const dx = event.clientX - startX;

      if (Math.abs(dx) > 4) {
        dragged = true;
      }

      scroller.scrollLeft = startLeft - dx;
    });

    function endDrag(event) {
      if (!dragging) {
        return;
      }

      dragging = false;
      scroller.classList.remove("is-dragging");

      if (event && event.pointerId && scroller.hasPointerCapture(event.pointerId)) {
        scroller.releasePointerCapture(event.pointerId);
      }
    }

    scroller.addEventListener("pointerup", endDrag);
    scroller.addEventListener("pointercancel", endDrag);

    /* A drag must not also trigger the VIEW button underneath. */
    scroller.addEventListener("click", function (event) {
      if (dragged) {
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
      }
    }, true);

    window.addEventListener("resize", scheduleSync);

    syncDots();
  }

  /*
    Chrome ignores `media` on <video><source>, so pick the lighter clip for
    small screens here and let the <source> list stay as the no-JS fallback.
  */
  function initHeroVideo() {
    const video = document.querySelector(".SBHG-hero-video");
    const small = window.matchMedia("(max-width: 767px)");

    if (!video || !small.matches) {
      return;
    }

    const mobileSource = video.getAttribute("data-mobile-src");

    if (!mobileSource || video.getAttribute("src") === mobileSource) {
      return;
    }

    video.setAttribute("src", mobileSource);

    const playback = video.play();

    if (playback && typeof playback.catch === "function") {
      playback.catch(function () {
        /* Autoplay refusal leaves the poster frame in place. */
      });
    }
  }

  /*
    First-load screen. Progress is real: hero image decode, video first frame,
    webfont, window load. The yellow fill height follows it. Capped at 8s so a
    slow network cannot trap the page behind the overlay.
  */
  function initLoader() {
    const root = document.documentElement;
    const loader = document.getElementById("SBHG-loader");
    const pct = document.getElementById("SBHG-loader-pct");
    const fill = document.getElementById("SBHG-loader-fill");

    if (!root.classList.contains("SBHG-loading")) {
      return;
    }

    if (!loader) {
      root.classList.remove("SBHG-loading");
      return;
    }

    const hero = document.getElementById("SBHG-hero-image");
    const video = document.querySelector(".SBHG-hero-video");
    const tasks = [];
    let done = 0;

    /*
      No single asset may hold the screen: each task is capped so the paced
      4s finish is reachable even when video or a font is slow.
    */
    function capped(promise, ms) {
      return Promise.race([
        promise,
        new Promise(function (resolve) {
          window.setTimeout(resolve, ms);
        })
      ]);
    }
    let finished = false;

    function paint(progress) {
      const value = Math.max(0, Math.min(1, progress));
      /* The star path spans y 59..165; fill exactly that band. */
      const top = 59;
      const bottom = 165;
      const height = value * (bottom - top);

      if (fill) {
        fill.setAttribute("height", height.toFixed(1));
        fill.setAttribute("y", (bottom - height).toFixed(1));
      }

      if (pct) {
        pct.textContent = Math.round(value * 100) + "%";
      }
    }

    function finish() {
      if (finished) {
        return;
      }

      finished = true;
      window.clearInterval(ticker);
      paint(1);
      loader.classList.add("is-done");
      document.dispatchEvent(new CustomEvent("SBHG:loaded"));

      window.setTimeout(function () {
        root.classList.remove("SBHG-loading");
        loader.hidden = true;

        /* Unlocking the scroll container can restore an offset; pin it to 0. */
        if (!window.location.hash && window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
      }, 480);

      try {
        sessionStorage.setItem("SBHG-loaded", "1");
      } catch (error) {
        /* Private mode: the loader simply shows again next time. */
      }
    }

    tasks.push(capped(new Promise(function (resolve) {
      if (!hero) {
        resolve();
        return;
      }

      function settle() {
        if (hero.decode) {
          hero.decode().then(resolve, resolve);
        } else {
          resolve();
        }
      }

      if (hero.complete && hero.naturalWidth > 0) {
        settle();
        return;
      }

      hero.addEventListener("load", settle, { once: true });
      hero.addEventListener("error", resolve, { once: true });
    }), 2500));

    tasks.push(capped(new Promise(function (resolve) {
      if (!video) {
        resolve();
        return;
      }

      if (video.readyState >= 2) {
        resolve();
        return;
      }

      video.addEventListener("loadeddata", resolve, { once: true });
      video.addEventListener("loadedmetadata", resolve, { once: true });
      video.addEventListener("error", resolve, { once: true });
    }), 1500));

    if (document.fonts && document.fonts.ready) {
      tasks.push(capped(document.fonts.ready, 2000));
    }

    tasks.push(capped(new Promise(function (resolve) {
      if (document.readyState === "complete") {
        resolve();
        return;
      }

      window.addEventListener("load", resolve, { once: true });
    }), 3000));

    const total = tasks.length;
    const minimum = 4000;
    const started = performance.now();
    let ticker = 0;
    let realProgress = 0;
    let ready = false;

    /*
      The bar never outruns real loading, but it is paced so the screen lasts
      about four seconds even when everything is cached.
    */
    function frame() {
      if (finished) {
        return;
      }

      const elapsed = performance.now() - started;
      const paced = Math.min(1, elapsed / minimum);

      paint(Math.min(realProgress, paced));

      if (ready && elapsed >= minimum) {
        finish();
      }
    }

    paint(0);
    ticker = window.setInterval(frame, 100);

    tasks.forEach(function (task) {
      task.then(function () {
        done += 1;
        realProgress = done / total;

        if (done >= total) {
          ready = true;
        }
      });
    });

    /* Hard ceiling: never hold the page longer than this, even on a slow link. */
    window.setTimeout(finish, 8000);
  }

  /*
    The page always opens at the top, including on refresh and back/forward
    cache restores. Explicit #hash links still win.
  */
  function startAtTop() {
    if (window.location.hash) {
      return;
    }

    if (typeof window.scrollTo === "function") {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        return;
      } catch (error) {
        /* Older engines reject the options object. */
      }

      window.scrollTo(0, 0);
    }
  }

  function initialize() {
    startAtTop();

    /*
      No glitch layers and no scroll-driven choreography. The class stays so the
      gallery, quote marquee and hover states keep their styling.
    */
    document.documentElement.classList.add("SBHG-motion");

    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        startAtTop();
      }
    });

    const root = document.documentElement;
    const year = document.getElementById("SBHG-year");

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    initLoader();
    initHeroVideo();
    initMenu();
    initProducts();
    initGallery();

    const modules = [
      ["heroFan", window.SBHG.heroFan]
    ];

    modules.forEach(function (entry) {
      const name = entry[0];
      const module = entry[1];

      if (!module || typeof module.init !== "function") {
        return;
      }

      try {
        module.init();
      } catch (error) {
        /*
          A choreography initialization failure must leave a readable,
          static page rather than concealed content.
        */
        if (name === "scroll") {
          root.classList.remove("SBHG-motion", "SBHG-native");
        }

        if (name === "heroFan" && typeof module.cancel === "function") {
          module.cancel();
        }

        console.error("SBHG: " + name + " initialization failed.", error);
      }
    });

    root.classList.add("SBHG-js");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
