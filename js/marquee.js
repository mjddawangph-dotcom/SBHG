(function () {
  "use strict";

  window.SBHG = window.SBHG || {};

  window.SBHG.marquee = {
    init: function () {
      const marquee = document.querySelector(".SBHG-marquee");
      const belt = document.querySelector(".SBHG-marquee-belt");
      const track = document.querySelector(".SBHG-marquee-track");
      const toggle = document.querySelector(".SBHG-marquee-toggle");

      if (!marquee || !belt || !track) {
        return;
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      const mobile = window.matchMedia("(max-width: 767px)");

      let animation = null;
      let userPaused = false;
      let hoverPaused = false;
      let focusPaused = false;
      let velocity = 0;
      let resizeTimer = 0;

      /*
        Duplicate the entire track, never individual words or characters.
        The original banner text is never modified.
      */
      if (!belt.querySelector('.SBHG-marquee-track[aria-hidden="true"]')) {
        const duplicate = track.cloneNode(true);

        duplicate.setAttribute("aria-hidden", "true");
        duplicate.setAttribute("inert", "");
        belt.appendChild(duplicate);
      }

      function updateButton() {
        if (!toggle) {
          return;
        }

        toggle.hidden = reducedMotion.matches;
        toggle.textContent = userPaused ? "RESUME" : "PAUSE";
        toggle.setAttribute("aria-pressed", String(userPaused));
        toggle.setAttribute(
          "aria-label",
          userPaused ? "Resume banner" : "Pause banner"
        );
      }

      function applyPlayback() {
        const paused =
          reducedMotion.matches ||
          userPaused ||
          hoverPaused ||
          focusPaused ||
          document.hidden;

        marquee.classList.toggle("SBHG-paused", paused);

        if (!animation) {
          return;
        }

        animation.playbackRate = 1 + velocity * 0.8;

        if (paused) {
          animation.pause();
        } else {
          animation.play();
        }
      }

      function measure() {
        resizeTimer = 0;

        const distance = track.getBoundingClientRect().width;

        belt.style.setProperty(
          "--SBHG-marquee-distance",
          distance.toFixed(2) + "px"
        );

        /*
          WAAPI provides continuous playback-rate changes without
          restarting the CSS animation when scroll velocity changes.
        */
        if (typeof belt.animate === "function") {
          let phase = 0;

          if (animation) {
            const timing = animation.effect.getTiming();
            const current = Number(animation.currentTime) || 0;

            phase = timing.duration
              ? (current % timing.duration) / timing.duration
              : 0;

            animation.cancel();
            animation = null;
          }

          belt.style.animation = "none";

          if (!reducedMotion.matches && distance > 0) {
            const pixelsPerSecond = mobile.matches ? 25 : 43;
            const duration = distance / pixelsPerSecond * 1000;

            animation = belt.animate(
              [
                { transform: "translateX(0)" },
                { transform: "translateX(" + (-distance) + "px)" }
              ],
              {
                duration: duration,
                iterations: Infinity,
                easing: "linear"
              }
            );

            animation.currentTime = phase * duration;
          } else {
            belt.style.transform = "none";
          }
        } else {
          belt.style.removeProperty("animation");
        }

        updateButton();
        applyPlayback();
      }

      function requestMeasure() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(measure, 80);
      }

      marquee.addEventListener("pointerenter", function () {
        hoverPaused = true;
        applyPlayback();
      });

      marquee.addEventListener("pointerleave", function () {
        hoverPaused = false;
        applyPlayback();
      });

      marquee.addEventListener("focusin", function () {
        focusPaused = true;
        applyPlayback();
      });

      marquee.addEventListener("focusout", function (event) {
        if (
          !event.relatedTarget ||
          !marquee.contains(event.relatedTarget)
        ) {
          focusPaused = false;
          applyPlayback();
        }
      });

      if (toggle) {
        toggle.addEventListener("click", function () {
          userPaused = !userPaused;
          updateButton();
          applyPlayback();
        });
      }

      document.addEventListener("SBHG:velocity", function (event) {
        velocity = reducedMotion.matches
          ? 0
          : Math.max(0, Math.min(1, event.detail.value || 0));

        applyPlayback();
      });

      document.addEventListener("visibilitychange", applyPlayback);

      reducedMotion.addEventListener("change", function () {
        velocity = 0;
        measure();
      });

      mobile.addEventListener("change", requestMeasure);

      if ("ResizeObserver" in window) {
        const observer = new ResizeObserver(requestMeasure);
        observer.observe(track);
      } else {
        window.addEventListener("resize", requestMeasure, { passive: true });
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(measure);
      }

      measure();
    }
  };
})();
