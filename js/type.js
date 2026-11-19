(function () {
  "use strict";

  window.SBHG = window.SBHG || {};

  /*
    Typography only: the manifesto lines rise out of their masks and the
    [data-decode] headings scramble once when they enter the viewport.
    Position-driven rather than IntersectionObserver, because rAF/IO are
    throttled in background tabs.
  */
  window.SBHG.type = {
    init: function () {
      const lines = Array.from(document.querySelectorAll("[data-line]"));
      const decodes = Array.from(document.querySelectorAll("[data-decode]"));

      if (!lines.length && !decodes.length) {
        return;
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]#";

      function scramble(element) {
        if (!element || element.dataset.decoded === "true") {
          return;
        }

        element.dataset.decoded = "true";

        const finalHTML = element.innerHTML;
        const finalText = element.textContent;

        if (reducedMotion.matches || !finalText) {
          return;
        }

        const started = performance.now();
        const duration = 620;

        function tick() {
          const progress = Math.min(1, (performance.now() - started) / duration);
          const resolved = Math.floor(finalText.length * progress);

          element.textContent = Array.from(finalText).map(function (character, index) {
            if (index < resolved || /\s/.test(character)) {
              return character;
            }

            return glyphs[Math.floor(Math.random() * glyphs.length)];
          }).join("");

          if (progress < 1) {
            window.setTimeout(tick, 40);
          } else {
            /* Restores the accent spans inside the statement lines. */
            element.innerHTML = finalHTML;
          }
        }

        tick();
      }

      function reveal(element) {
        if (element.dataset.revealed === "true") {
          return;
        }

        element.dataset.revealed = "true";

        const index = Number(element.getAttribute("data-line")) || 0;
        const delay = index * 160;

        if (typeof element.animate === "function") {
          element.animate(
            [
              { transform: "translateY(115%)" },
              { transform: "translateY(0)" }
            ],
            {
              duration: 1400,
              delay: delay,
              easing: "cubic-bezier(.16, .84, .32, 1)",
              fill: "both"
            }
          );
        }

        element.classList.add("is-in");
      }

      function inView(element) {
        const rect = element.getBoundingClientRect();
        const vh = window.innerHeight;
        return rect.bottom > 0 && rect.top < vh * 0.72;
      }

      let timer = 0;

      function check() {
        timer = 0;

        lines.forEach(function (line) {
          if (!line.classList.contains("is-in") && inView(line)) {
            reveal(line);
          }
        });

        decodes.forEach(function (element) {
          if (element.dataset.decoded !== "true" && inView(element)) {
            scramble(element);
          }
        });
      }

      function schedule() {
        if (timer) {
          return;
        }

        timer = window.setTimeout(check, 90);
      }

      if (reducedMotion.matches) {
        lines.forEach(reveal);
        return;
      }

      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      document.addEventListener("visibilitychange", schedule);

      /*
        While the loading screen is up, stay put: revealing behind the overlay
        would spend the animation where nobody can see it.
      */
      if (document.documentElement.classList.contains("SBHG-loading")) {
        document.addEventListener("SBHG:loaded", function () {
          check();
          window.setTimeout(schedule, 250);
        }, { once: true });
      } else {
        check();
        window.setTimeout(schedule, 250);
      }
    }
  };
})();
