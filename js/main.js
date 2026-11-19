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
    let frame = 0;
    let dragging = false;
    let dragged = false;
    let startX = 0;
    let startLeft = 0;

    function nearestIndex() {
      const left = scroller.scrollLeft;
      let best = 0;
      let bestDistance = Infinity;

      tiles.forEach(function (tile, index) {
        const distance = Math.abs(tile.offsetLeft - row.offsetLeft - left);

        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });

      return best;
    }

    function syncDots() {
      frame = 0;
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

    scroller.addEventListener("scroll", function () {
      if (!frame) {
        frame = window.requestAnimationFrame(syncDots);
      }
    }, { passive: true });

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

    window.addEventListener("resize", function () {
      if (!frame) {
        frame = window.requestAnimationFrame(syncDots);
      }
    });

    syncDots();
  }

  function initialize() {
    const root = document.documentElement;
    const year = document.getElementById("SBHG-year");

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    initMenu();
    initProducts();
    initGallery();

    const modules = [
      ["glitch", window.SBHG.glitch],
      ["scroll", window.SBHG.scroll],
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
