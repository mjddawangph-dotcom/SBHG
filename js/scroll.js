(function () {
  "use strict";

  window.SBHG = window.SBHG || {};

  window.SBHG.scroll = {
    init: function () {
      const root = document.documentElement;
      const header = document.getElementById("SBHG-header");
      const hero = document.getElementById("home");
      const heroWipe = document.querySelector(".SBHG-hero-wipe");
      const manifesto = document.getElementById("manifesto");
      const collection = document.getElementById("collection");
      const row = document.getElementById("SBHG-collection-row");
      const collectionWindow = document.querySelector(".SBHG-collection-window");
      const contact = document.getElementById("contact");
      const footer = document.getElementById("footer");
      const footerMark = document.querySelector(".SBHG-footer-mark");

      const tiles = Array.from(document.querySelectorAll("[data-tile]"));
      const lines = Array.from(document.querySelectorAll("[data-line]"));
      const pins = Array.from(document.querySelectorAll("[data-pin]"));
      const sections = Array.from(document.querySelectorAll(".SBHG-section"));

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      const desktop = window.matchMedia("(min-width: 768px)");
      const unstaggered = window.matchMedia("(max-width: 639px)");

      const nativeSupported = Boolean(
        window.CSS &&
        CSS.supports("animation-timeline", "view()") &&
        CSS.supports("view-timeline-name", "--SBHG-test") &&
        CSS.supports("animation-range", "contain 0% contain 100%")
      );

      const geometry = new Map();
      const tileGeometry = new Map();
      const crossedTiles = new WeakSet();
      const enteredSections = new WeakSet();

      let sectionObserver = null;
      let headingObserver = null;
      let tileObserver = null;
      let resizeObserver = null;

      let frame = 0;
      let decayTimer = 0;
      let resizeTimer = 0;
      let tearTimer = 0;
      let footerTimer = 0;

      let previousY = window.scrollY;
      let previousTime = performance.now();
      let velocity = 0;
      let direction = 1;
      let documentHeight = 1;
      let viewportHeight = window.innerHeight;
      let collectionTravel = 0;
      let previousHeroProgress = 0;
      let footerFinalized = false;

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function glitch() {
        return window.SBHG.glitch;
      }

      function emitVelocity(value) {
        document.dispatchEvent(
          new CustomEvent("SBHG:velocity", {
            detail: { value: value }
          })
        );
      }

      /*
        These complete native rules are injected once. They also allow
        this JS hand-off to work with the previously supplied motion CSS.
      */
      function installNativeStyles() {
        if (document.getElementById("SBHG-scroll-native-styles")) {
          return;
        }

        const style = document.createElement("style");
        style.id = "SBHG-scroll-native-styles";

        style.textContent = `
          @supports (animation-timeline: view()) {
            @keyframes SBHG-js-hero-out {
              0%, 20% {
                transform: translateY(0) scale(1);
              }
              65%, 100% {
                transform: translateY(-8svh) scale(.94);
              }
            }

            @keyframes SBHG-js-hero-wipe {
              0%, 45% {
                transform: translateY(-150%);
              }
              75%, 100% {
                transform: translateY(0);
              }
            }

            @keyframes SBHG-js-seam {
              from { transform: translateX(0); }
              to { transform: translateX(105%); }
            }

            @keyframes SBHG-js-line-first {
              0%, 11.99% { transform: translateY(110%); }
              12%, 100% { transform: translateY(0); }
            }

            @keyframes SBHG-js-line-second {
              0%, 39.99% { transform: translateY(110%); }
              40%, 100% { transform: translateY(0); }
            }

            @keyframes SBHG-js-line-third {
              0%, 67.99% { transform: translateY(110%); }
              68%, 100% { transform: translateY(0); }
            }

            @keyframes SBHG-js-manifesto-rail {
              from { transform: scaleY(0); }
              to { transform: scaleY(1); }
            }

            @keyframes SBHG-js-halftone {
              from { transform: translateY(0); }
              to { transform: translateY(8%); }
            }

            @keyframes SBHG-js-horizontal {
              from {
                transform: translateX(0) skewY(var(--SBHG-skew));
              }
              to {
                transform:
                  translateX(calc(-1 * var(--SBHG-collection-travel)))
                  skewY(var(--SBHG-skew));
              }
            }

            @keyframes SBHG-js-contact-rule {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }

            @keyframes SBHG-js-contact-button {
              from { transform: translateX(-110%); }
              to { transform: translateX(0); }
            }

            @keyframes SBHG-js-footer {
              from { transform: translateY(110%); }
              to { transform: translateY(0); }
            }

            .SBHG-motion.SBHG-native .SBHG-hero {
              view-timeline-name: --SBHG-js-hero;
              view-timeline-axis: block;
            }

            .SBHG-motion.SBHG-native .SBHG-hero-scroll {
              animation: SBHG-js-hero-out 1s linear both;
              animation-timeline: --SBHG-js-hero;
              animation-range: exit 0% exit 100%;
            }

            .SBHG-motion.SBHG-native .SBHG-hero-wipe::after {
              animation: SBHG-js-hero-wipe 1s linear both;
              animation-timeline: --SBHG-js-hero;
              animation-range: exit 0% exit 100%;
            }

            .SBHG-motion.SBHG-native .SBHG-seam::after {
              animation: SBHG-js-seam 1s linear both;
              animation-timeline: view();
              animation-range: entry 0% entry 100%;
            }

            .SBHG-motion.SBHG-native .SBHG-contact {
              view-timeline-name: --SBHG-js-contact;
              view-timeline-axis: block;
            }


            .SBHG-motion.SBHG-native .SBHG-footer {
              view-timeline-name: --SBHG-js-footer;
              view-timeline-axis: block;
            }

            .SBHG-motion.SBHG-native .SBHG-footer-mark {
              animation: SBHG-js-footer 1s linear both;
              animation-timeline: --SBHG-js-footer;
              animation-range: entry 0% entry 65%;
            }

            @media (min-width: 768px) {
              .SBHG-motion.SBHG-native .SBHG-manifesto {
                view-timeline-name: --SBHG-js-manifesto;
                view-timeline-axis: block;
              }

              .SBHG-motion.SBHG-native [data-line="0"] {
                animation: SBHG-js-line-first 1s steps(1, end) both;
                animation-timeline: --SBHG-js-manifesto;
                animation-range: contain 0% contain 100%;
              }

              .SBHG-motion.SBHG-native [data-line="1"] {
                animation: SBHG-js-line-second 1s steps(1, end) both;
                animation-timeline: --SBHG-js-manifesto;
                animation-range: contain 0% contain 100%;
              }

              .SBHG-motion.SBHG-native [data-line="2"] {
                animation: SBHG-js-line-third 1s steps(1, end) both;
                animation-timeline: --SBHG-js-manifesto;
                animation-range: contain 0% contain 100%;
              }

              .SBHG-motion.SBHG-native .SBHG-manifesto-rail > span {
                animation: SBHG-js-manifesto-rail 1s linear both;
                animation-timeline: --SBHG-js-manifesto;
                animation-range: contain 0% contain 100%;
              }

              .SBHG-motion.SBHG-native .SBHG-manifesto-dots {
                animation: SBHG-js-halftone 1s linear both;
                animation-timeline: --SBHG-js-manifesto;
                animation-range: contain 0% contain 100%;
              }

              .SBHG-motion.SBHG-native .SBHG-collection {
                view-timeline-name: --SBHG-js-collection;
                view-timeline-axis: block;
              }

              .SBHG-motion.SBHG-native .SBHG-collection-row {
                animation: SBHG-js-horizontal 1s linear both;
                animation-timeline: --SBHG-js-collection;
                animation-range: contain 0% contain 100%;
              }
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .SBHG-glitch-layer {
              display: none !important;
            }

            .SBHG-bursting {
              animation: none !important;
            }
          }
        `;

        document.head.appendChild(style);
      }

      function measureElement(element) {
        if (!element) {
          return;
        }

        const rect = element.getBoundingClientRect();

        geometry.set(element, {
          top: rect.top + window.scrollY,
          height: rect.height
        });
      }

      function measure() {
        viewportHeight = window.innerHeight;
        documentHeight = Math.max(
          1,
          root.scrollHeight - viewportHeight
        );

        [hero, manifesto, collection, contact, footer].forEach(measureElement);
        sections.forEach(measureElement);

        if (row && collectionWindow && desktop.matches && !reducedMotion.matches) {
          collectionTravel = Math.max(
            0,
            row.scrollWidth - collectionWindow.clientWidth
          );
        } else {
          collectionTravel = 0;
        }

        root.style.setProperty(
          "--SBHG-collection-travel",
          collectionTravel.toFixed(2) + "px"
        );

        const rowRect = row ? row.getBoundingClientRect() : null;

        tiles.forEach(function (tile) {
          const rect = tile.getBoundingClientRect();

          tileGeometry.set(tile, {
            top: rect.top + window.scrollY,
            height: rect.height,
            width: rect.width,
            left: rowRect ? rect.left - rowRect.left : 0
          });
        });

        update();
      }

      function pinnedProgress(element, y) {
        const item = geometry.get(element);

        if (!item) {
          return 0;
        }

        return clamp(
          (y - item.top) / Math.max(1, item.height - viewportHeight),
          0,
          1
        );
      }

      function entryProgress(element, y) {
        const item = geometry.get(element);

        if (!item) {
          return 1;
        }

        return clamp(
          (y + viewportHeight - item.top) /
            Math.max(1, Math.min(viewportHeight, item.height)),
          0,
          1
        );
      }

      function setWillChange(element, enabled) {
        if (!element) {
          return;
        }

        if (enabled) {
          element.style.willChange = "transform";
        } else {
          element.style.removeProperty("will-change");
        }
      }

      function updatePinHints(y) {
        pins.forEach(function (pin) {
          const section = pin.closest(".SBHG-section");
          const item = geometry.get(section);

          const active = Boolean(
            !reducedMotion.matches &&
            desktop.matches &&
            item &&
            y >= item.top &&
            y < item.top + item.height - viewportHeight
          );

          setWillChange(pin, active);

          if (pin.classList.contains("SBHG-collection-pin")) {
            setWillChange(row, active);
          }

          if (pin.classList.contains("SBHG-manifesto-pin")) {
            lines.forEach(function (line) {
              setWillChange(line, active);
            });
          }
        });
      }

      function updateTileWipes(collectionProgress, y) {
        tiles.forEach(function (tile, index) {
          const item = tileGeometry.get(tile);

          if (!item) {
            return;
          }

          let progress = 1;

          if (desktop.matches) {
            const x = item.left - collectionTravel * collectionProgress;
            progress = clamp(
              (window.innerWidth - x) / Math.max(1, item.width * 0.7),
              0,
              1
            );
          } else {
            progress = clamp(
              (y + viewportHeight * 0.9 - item.top) /
                Math.max(1, Math.min(item.height, viewportHeight * 0.5)),
              0,
              1
            );
          }

          tile.style.setProperty(
            "--SBHG-tile-wipe",
            (progress * 110).toFixed(2) + "%"
          );

          /*
            Timing is used only for the small entry hit. Horizontal
            displacement itself is exclusively scroll-position driven.
          */
          tile.dataset.SBHGStagger = unstaggered.matches
            ? "0"
            : String(index * 60);
        });
      }

      function decodeVisibleLines(progress) {
        if (!glitch()) {
          return;
        }

        const thresholds = [0.12, 0.4, 0.68];

        lines.forEach(function (line, index) {
          if (!desktop.matches || progress >= thresholds[index]) {
            glitch().decode(line);
          }
        });
      }

      function updateFooterFinal(progress) {
        if (
          footerFinalized ||
          reducedMotion.matches ||
          progress < 0.65 ||
          !footerMark
        ) {
          return;
        }

        footerFinalized = true;

        footerTimer = window.setTimeout(function () {
          if (glitch()) {
            glitch().finalizeFooter(footerMark);
          }
        }, 120);
      }

      function update() {
        frame = 0;

        const y = window.scrollY;

        if (header) {
          header.classList.toggle("SBHG-scrolled", y > 80);
        }

        root.style.setProperty(
          "--SBHG-progress",
          clamp(y / documentHeight, 0, 1).toFixed(5)
        );

        if (reducedMotion.matches) {
          updatePinHints(y);
          return;
        }

        const heroItem = geometry.get(hero);
        const heroProgress = heroItem
          ? clamp((y - heroItem.top) / Math.max(1, heroItem.height), 0, 1)
          : 0;

        const heroOut = clamp((heroProgress - 0.2) / 0.45, 0, 1);
        const wipeProgress = clamp((heroProgress - 0.45) / 0.3, 0, 1);
        const manifestoProgress = pinnedProgress(manifesto, y);
        const collectionProgress = pinnedProgress(collection, y);
        const contactProgress = entryProgress(contact, y);
        const footerProgress = entryProgress(footer, y);

        root.style.setProperty("--SBHG-skew", (velocity * 1.5).toFixed(3) + "deg");

        if (!nativeSupported) {
          root.style.setProperty(
            "--SBHG-hero-scale",
            (1 - heroOut * 0.06).toFixed(5)
          );

          root.style.setProperty(
            "--SBHG-hero-lift",
            (-heroOut * viewportHeight * 0.08).toFixed(2) + "px"
          );

          root.style.setProperty(
            "--SBHG-hero-wipe",
            (-150 + wipeProgress * 150).toFixed(2) + "%"
          );

          root.style.setProperty(
            "--SBHG-manifesto-drift",
            (manifestoProgress * 8).toFixed(2) + "%"
          );

          root.style.setProperty(
            "--SBHG-manifesto-progress",
            manifestoProgress.toFixed(5)
          );

          root.style.setProperty(
            "--SBHG-collection-x",
            desktop.matches
              ? (-collectionTravel * collectionProgress).toFixed(2) + "px"
              : "0px"
          );

          const thresholds = [0.12, 0.4, 0.68];

          lines.forEach(function (line, index) {
            line.style.setProperty(
              "--SBHG-line-y",
              desktop.matches && manifestoProgress < thresholds[index]
                ? "110%"
                : "0%"
            );
          });

          sections.forEach(function (section) {
            const progress = entryProgress(section, y);

            section.style.setProperty(
              "--SBHG-seam-x",
              (progress * 105).toFixed(2) + "%"
            );
          });

          const contactReveal = clamp(
            (contactProgress - 0.15) / 0.5,
            0,
            1
          );

          root.style.setProperty(
            "--SBHG-contact-progress",
            contactReveal.toFixed(5)
          );

          root.style.setProperty(
            "--SBHG-contact-wipe",
            (-110 + contactReveal * 110).toFixed(2) + "%"
          );

          root.style.setProperty(
            "--SBHG-footer-y",
            (110 * (1 - clamp(footerProgress / 0.65, 0, 1))).toFixed(2) + "%"
          );
        }

        if (
          heroWipe &&
          (
            (previousHeroProgress < 0.45 && heroProgress >= 0.45) ||
            (previousHeroProgress > 0.45 && heroProgress <= 0.45)
          )
        ) {
          heroWipe.classList.add("SBHG-wipe-tear");
          window.clearTimeout(tearTimer);

          tearTimer = window.setTimeout(function () {
            heroWipe.classList.remove("SBHG-wipe-tear");
          }, 200);
        }

        previousHeroProgress = heroProgress;

        updatePinHints(y);
        updateTileWipes(collectionProgress, y);
        decodeVisibleLines(manifestoProgress);
        updateFooterFinal(footerProgress);

        sections.forEach(function (section) {
          section.dataset.SBHGDirection = direction > 0 ? "down" : "up";
        });
      }

      function requestUpdate() {
        if (!frame) {
          frame = window.requestAnimationFrame(update);
        }
      }

      /*
        One window scroll listener, passive and rAF-throttled.
        No wheel listeners, scroll locking, or perpetual rAF loop.
      */
      function onScroll() {
        const now = performance.now();
        const y = window.scrollY;
        const delta = y - previousY;
        const elapsed = Math.max(8, now - previousTime);
        const raw = clamp(Math.abs(delta) / elapsed / 2.5, 0, 1);
        const priorVelocity = velocity;

        if (delta !== 0) {
          direction = delta > 0 ? 1 : -1;
        }

        velocity = raw;
        previousY = y;
        previousTime = now;

        if (!reducedMotion.matches) {
          emitVelocity(velocity);

          if (velocity > 0.75 && priorVelocity <= 0.75 && glitch()) {
            const target = document.elementFromPoint(
              window.innerWidth * 0.45,
              viewportHeight * 0.55
            );

            const eligibleTarget = target instanceof Element
              ? target.closest("[data-tile], [data-glitch]")
              : null;

            if (eligibleTarget) {
              glitch().burst(eligibleTarget, {
                micro: true,
                duration: 160,
                intensity: velocity
              });
            }
          }
        }

        window.clearTimeout(decayTimer);

        decayTimer = window.setTimeout(function () {
          velocity = 0;
          root.style.setProperty("--SBHG-skew", "0deg");
          emitVelocity(0);
          requestUpdate();
        }, 260);

        requestUpdate();
      }

      function createObservers() {
        if (sectionObserver) {
          sectionObserver.disconnect();
        }

        if (headingObserver) {
          headingObserver.disconnect();
        }

        if (tileObserver) {
          tileObserver.disconnect();
        }

        if (!("IntersectionObserver" in window)) {
          document.querySelectorAll("[data-decode]").forEach(function (heading) {
            if (glitch()) {
              glitch().decode(heading);
            }
          });
          return;
        }

        sectionObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting || enteredSections.has(entry.target)) {
              return;
            }

            enteredSections.add(entry.target);

            if (reducedMotion.matches || !glitch()) {
              return;
            }

            const target = entry.target.querySelector(
              ".SBHG-section-heading[data-glitch], .SBHG-statement[data-glitch]"
            );

            if (target) {
              glitch().burst(target, {
                duration: 160,
                micro: true,
                intensity: velocity
              });
            }
          });
        }, {
          threshold: 0,
          rootMargin: "0px 0px -20% 0px"
        });

        sections.forEach(function (section) {
          sectionObserver.observe(section);
        });

        headingObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting || !glitch()) {
              return;
            }

            glitch().decode(entry.target);
            headingObserver.unobserve(entry.target);
          });
        }, {
          threshold: 0.2
        });

        document.querySelectorAll("[data-decode]:not([data-line])").forEach(
          function (heading) {
            headingObserver.observe(heading);
          }
        );

        tileObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting || crossedTiles.has(entry.target)) {
              return;
            }

            crossedTiles.add(entry.target);

            if (reducedMotion.matches || !glitch()) {
              return;
            }

            const delay = unstaggered.matches
              ? 0
              : Number(entry.target.dataset.SBHGStagger || 0);

            window.setTimeout(function () {
              if (!reducedMotion.matches && glitch()) {
                glitch().burst(entry.target, {
                  micro: true,
                  duration: 160,
                  intensity: velocity
                });
              }
            }, delay);
          });
        }, {
          threshold: 0,
          rootMargin: "-50% 0px -40% 0px"
        });

        tiles.forEach(function (tile) {
          tileObserver.observe(tile);
        });
      }

      function applyMode() {
        const motionEnabled = !reducedMotion.matches;

        root.classList.toggle("SBHG-motion", motionEnabled);
        root.classList.toggle(
          "SBHG-native",
          motionEnabled && nativeSupported
        );

        velocity = 0;
        root.style.setProperty("--SBHG-skew", "0deg");
        emitVelocity(0);

        if (!motionEnabled) {
          window.clearTimeout(tearTimer);
          window.clearTimeout(footerTimer);

          if (heroWipe) {
            heroWipe.classList.remove("SBHG-wipe-tear");
          }

          pins.forEach(function (pin) {
            setWillChange(pin, false);
          });

          setWillChange(row, false);

          lines.forEach(function (line) {
            setWillChange(line, false);
            line.style.setProperty("--SBHG-line-y", "0%");
          });

          tiles.forEach(function (tile) {
            tile.style.setProperty("--SBHG-tile-wipe", "110%");
          });
        }

        createObservers();

        /*
          A single post-layout measurement handles new pin heights after
          a breakpoint or motion-preference change.
        */
        window.requestAnimationFrame(measure);
      }

      function onResize() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(measure, 80);
      }

      if (!hero || !manifesto || !collection || !row) {
        return;
      }

      installNativeStyles();

      root.style.setProperty("--SBHG-hero-wipe", "-150%");
      root.style.setProperty("--SBHG-collection-x", "0px");

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });

      reducedMotion.addEventListener("change", applyMode);
      desktop.addEventListener("change", applyMode);
      unstaggered.addEventListener("change", onResize);

      document.addEventListener("SBHG:hero-settled", onResize);

      /*
        Move the native scrollbar to the corresponding scrub position
        when keyboard focus lands outside the visible collection band.
      */
      row.addEventListener("focusin", function (event) {
        if (
          reducedMotion.matches ||
          !desktop.matches ||
          collectionTravel <= 0 ||
          !(event.target instanceof Element)
        ) {
          return;
        }

        const tile = event.target.closest("[data-tile]");
        const item = tileGeometry.get(tile);
        const section = geometry.get(collection);

        if (!tile || !item || !section) {
          return;
        }

        const currentProgress = pinnedProgress(collection, window.scrollY);
        const currentX = collectionTravel * currentProgress;
        const visibleLeft = item.left - currentX;
        const visibleRight = visibleLeft + item.width;
        const inset = 24;

        if (
          visibleLeft >= inset &&
          visibleRight <= window.innerWidth - inset
        ) {
          return;
        }

        const desiredX = clamp(
          item.left - inset,
          0,
          collectionTravel
        );

        const desiredProgress = desiredX / collectionTravel;
        const desiredY =
          section.top +
          desiredProgress * Math.max(1, section.height - viewportHeight);

        window.scrollTo({
          top: desiredY,
          left: 0,
          behavior: "instant"
        });

        requestUpdate();
      });

      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(onResize);

        [hero, manifesto, collection, contact, footer].forEach(function (element) {
          if (element) {
            resizeObserver.observe(element);
          }
        });

        resizeObserver.observe(row);
      }

      window.addEventListener("load", measure, { once: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(measure);
      }

      applyMode();
      measure();
    }
  };
})();
