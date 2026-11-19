(function () {
  "use strict";

  window.SBHG = window.SBHG || {};

  window.SBHG.heroFan = {
    init: function () {
      const stage = document.getElementById("SBHG-hero-stage");
      const original = document.getElementById("SBHG-hero-original");
      const image = document.getElementById("SBHG-hero-image");

      if (!stage || !original || !image) {
        return;
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      const narrowScreen = window.matchMedia("(max-width: 767px)");
      const timers = new Set();
      const animations = new Set();
      const copies = [];

      let started = false;
      let finished = false;

      function later(callback, delay) {
        const timer = window.setTimeout(function () {
          timers.delete(timer);
          callback();
        }, delay);

        timers.add(timer);
        return timer;
      }

      function animate(element, frames, options) {
        if (typeof element.animate !== "function") {
          return null;
        }

        const animation = element.animate(frames, options);
        animations.add(animation);

        animation.finished.then(
          function () {
            animations.delete(animation);
          },
          function () {
            animations.delete(animation);
          }
        );

        return animation;
      }

      function settle() {
        if (finished) {
          return;
        }

        finished = true;

        timers.forEach(function (timer) {
          window.clearTimeout(timer);
        });
        timers.clear();

        animations.forEach(function (animation) {
          animation.cancel();
        });
        animations.clear();

        copies.forEach(function (copy) {
          copy.remove();
        });
        copies.length = 0;

        original.style.removeProperty("will-change");
        original.style.removeProperty("transform");
        original.classList.remove("SBHG-chromatic-snap");

        stage.style.removeProperty("will-change");
        stage.removeAttribute("data-animating");

        document.dispatchEvent(new CustomEvent("SBHG:hero-settled"));
      }

      function createCopy(plate, index) {
        const plane = document.createElement("div");

        plane.className = "SBHG-hero-plane";
        plane.setAttribute("aria-hidden", "true");
        plane.setAttribute("inert", "");
        plane.style.zIndex = String(6 - index);
        plane.style.pointerEvents = "none";
        plane.style.willChange = "transform, opacity";
        plane.style.filter = 'url("#SBHG-' + plate + '")';

        const copyImage = image.cloneNode(false);

        /* Reuse whatever the browser actually loaded (WebP on mobile/desktop). */
        if (image.currentSrc) {
          copyImage.src = image.currentSrc;
        }

        copyImage.removeAttribute("id");
        copyImage.removeAttribute("fetchpriority");
        copyImage.setAttribute("alt", "");
        copyImage.setAttribute("aria-hidden", "true");
        copyImage.loading = "eager";

        plane.appendChild(copyImage);
        stage.insertBefore(plane, original);
        copies.push(plane);

        return plane;
      }

      function start() {
        if (started || finished) {
          return;
        }

        started = true;

        if (
          reducedMotion.matches ||
          document.hidden ||
          typeof original.animate !== "function"
        ) {
          settle();
          return;
        }

        /* Same plate count and palette everywhere, so phones see the full fan. */
        const plates = ["cyan", "magenta", "yellow", "bone", "bruise", "silhouette"];

        const extrusionDuration = 340;
        const stagger = 50;
        const holdDuration = 600;
        const collapseDuration = 580;

        stage.setAttribute("data-animating", "true");
        original.style.willChange = "transform";

        /*
          The first 250ms contain only the original image.
          Copies are created only when their extrusion begins.
        */
        plates.forEach(function (plate, index) {
          later(function () {
            if (finished || reducedMotion.matches) {
              return;
            }

            const plane = createCopy(plate, index);
            const depth = -40 - index * 36;

            const scale = 0.92 - index * 0.028;

            const side = index % 2 === 0 ? -1 : 1;
            const x = side * (56 + index * 30);

            const y = -4 - index * 4;
            const spin = side * (1.8 + index * 1.1);
            const opacity = plate === "silhouette" ? 0.55 : 0.85;

            const extended =
              "translate3d(" + x + "px," + y + "px," + depth +
              "px) rotate(" + spin + "deg) scale(" + scale + ")";

            plane.dataset.extendedTransform = extended;
            plane.dataset.extendedOpacity = String(opacity);

            animate(
              plane,
              [
                {
                  transform: "translate3d(0,0,0) rotate(0deg) scale(1)",
                  opacity: 0
                },
                {
                  transform: extended,
                  opacity: opacity
                }
              ],
              {
                duration: extrusionDuration,
                easing: "cubic-bezier(.2,.7,.2,1)",
                fill: "forwards"
              }
            );
          }, 250 + index * stagger);
        });

        const collapseStart =
          250 +
          (plates.length - 1) * stagger +
          extrusionDuration +
          holdDuration;

        later(function () {
          copies.forEach(function (plane) {
            animate(
              plane,
              [
                {
                  transform: plane.dataset.extendedTransform,
                  opacity: Number(plane.dataset.extendedOpacity)
                },
                {
                  transform: "translate3d(0,0,0) rotate(0deg) scale(1)",
                  opacity: 0
                }
              ],
              {
                duration: collapseDuration,
                easing: "cubic-bezier(.3,0,.15,1)",
                fill: "forwards"
              }
            );
          });

          animate(
            original,
            [
              { transform: "scale(1)" },
              { transform: "scale(1.015)", offset: 0.55 },
              { transform: "scale(1)" }
            ],
            {
              duration: collapseDuration,
              easing: "cubic-bezier(.2,.65,.25,1)",
              fill: "none"
            }
          );

          later(function () {
            original.classList.add("SBHG-chromatic-snap");

            window.requestAnimationFrame(function () {
              original.classList.remove("SBHG-chromatic-snap");
            });
          }, Math.round(collapseDuration * 0.55));
        }, collapseStart);

        later(settle, collapseStart + collapseDuration + 30);
      }

      function motionChanged() {
        if (reducedMotion.matches) {
          settle();
        }
      }

      reducedMotion.addEventListener("change", motionChanged);

      document.addEventListener("visibilitychange", function () {
        if (document.hidden && started && !finished) {
          settle();
        }
      });

      image.addEventListener("error", settle, { once: true });

      function boot() {
        if (image.complete) {
          if (image.naturalWidth > 0) {
            start();
          } else {
            settle();
          }
        } else {
          image.addEventListener("load", start, { once: true });
        }
      }

      /*
        Hold the intro until the loading screen is gone, so the plates play
        where they can actually be seen.
      */
      if (document.documentElement.classList.contains("SBHG-loading")) {
        document.addEventListener("SBHG:loaded", boot, { once: true });
      } else {
        boot();
      }

      window.SBHG.heroFan.cancel = settle;
    }
  };
})();
