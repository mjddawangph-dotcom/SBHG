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
      title.textContent = "ITEM " + number;

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

  function initContact() {
    const form = document.getElementById("SBHG-contact-form");
    const email = document.getElementById("SBHG-email");
    const status = document.getElementById("SBHG-form-status");
    const submit = form ? form.querySelector('[type="submit"]') : null;

    if (!form || !email || !status || !submit) {
      return;
    }

    const endpoint = (form.dataset.endpoint || "").trim();
    const hasEndpoint = Boolean(
      endpoint &&
      endpoint.indexOf("[PLACEHOLDER:") === -1
    );

    form.noValidate = true;

    if (!hasEndpoint) {
      submit.disabled = true;
      status.textContent =
        "[PLACEHOLDER: CONTACT FORM ENDPOINT — submission unavailable]";
    } else {
      submit.disabled = false;
      status.textContent = "";
      form.setAttribute("action", endpoint);
    }

    function validate() {
      email.setAttribute("aria-invalid", "false");

      if (email.validity.valueMissing) {
        email.setAttribute("aria-invalid", "true");
        status.textContent = "Enter an email address.";
        email.focus();
        return false;
      }

      if (email.validity.typeMismatch || !email.validity.valid) {
        email.setAttribute("aria-invalid", "true");
        status.textContent = "Enter a valid email address.";
        email.focus();
        return false;
      }

      return true;
    }

    email.addEventListener("input", function () {
      if (email.getAttribute("aria-invalid") === "true") {
        email.setAttribute("aria-invalid", "false");

        status.textContent = hasEndpoint
          ? ""
          : "[PLACEHOLDER: CONTACT FORM ENDPOINT — submission unavailable]";
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!hasEndpoint) {
        status.textContent =
          "[PLACEHOLDER: CONTACT FORM ENDPOINT — submission unavailable]";
        return;
      }

      if (!validate()) {
        return;
      }

      if (typeof window.fetch !== "function") {
        status.textContent =
          "This browser cannot submit the form. Use a browser with fetch support.";
        return;
      }

      submit.disabled = true;
      form.setAttribute("aria-busy", "true");
      status.textContent = "SUBMITTING";

      const controller = typeof AbortController === "function"
        ? new AbortController()
        : null;

      const timeout = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, 15000)
        : 0;

      try {
        const options = {
          method: "POST",
          body: new FormData(form),
          headers: {
            Accept: "application/json"
          },
          credentials: "same-origin"
        };

        if (controller) {
          options.signal = controller.signal;
        }

        const response = await fetch(endpoint, options);

        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        /*
          Report only the observed HTTP response. Do not claim signup,
          subscription, delivery, or any other unverified outcome.
        */
        status.textContent = "Response received.";
      } catch (error) {
        status.textContent = error && error.name === "AbortError"
          ? "The request timed out. Try again."
          : "The request could not be completed. Try again.";
      } finally {
        window.clearTimeout(timeout);
        submit.disabled = false;
        form.removeAttribute("aria-busy");
      }
    });
  }

  function initialize() {
    const root = document.documentElement;
    const year = document.getElementById("SBHG-year");

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    initMenu();
    initProducts();
    initContact();

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
