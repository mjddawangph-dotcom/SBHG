(function () {
  "use strict";

  window.SBHG = window.SBHG || {};

  window.SBHG.glitch = (function () {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const lastBurst = new WeakMap();
    const seenHeadings = new WeakSet();
    const decodeJobs = new Set();

    let initialized = false;
    let scheduledTimer = 0;
    let activeTimer = 0;
    let activeElement = null;
    let activeLayer = null;
    let activeOverflow = null;
    let scheduledStopped = false;
    let finalRequested = false;
    let finalDone = false;
    let finalTimer = 0;

    function random(min, max) {
      return min + Math.random() * (max - min);
    }

    function visible(element) {
      if (!element || !element.isConnected) {
        return false;
      }

      const rect = element.getBoundingClientRect();

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth &&
        element.getClientRects().length > 0
      );
    }

    function eligible(element) {
      if (!element || reducedMotion.matches || document.hidden) {
        return false;
      }

      if (
        element.matches("input, textarea, select, label") ||
        element.closest("[data-animating]")
      ) {
        return false;
      }

      return visible(element);
    }

    function sanitizeClone(clone) {
      const nodes = [clone].concat(Array.from(clone.querySelectorAll("*")));

      nodes.forEach(function (node) {
        node.removeAttribute("id");
        node.removeAttribute("for");
        node.removeAttribute("name");
        node.removeAttribute("href");
        node.removeAttribute("aria-labelledby");
        node.removeAttribute("aria-describedby");

        Array.from(node.attributes).forEach(function (attribute) {
          if (
            attribute.name.indexOf("data-") === 0 ||
            attribute.name.indexOf("on") === 0
          ) {
            node.removeAttribute(attribute.name);
          }
        });

        node.classList.remove("SBHG-bursting");

        if (node.matches("button, input, textarea, select")) {
          node.disabled = true;
        }

        node.setAttribute("tabindex", "-1");
      });

      clone.querySelectorAll(".SBHG-glitch-layer").forEach(function (layer) {
        layer.remove();
      });

      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("inert", "");
      clone.classList.add("SBHG-glitch-copy");

      return clone;
    }

    function finishActive() {
      window.clearTimeout(activeTimer);
      activeTimer = 0;

      if (activeLayer) {
        activeLayer.remove();
      }

      if (activeElement) {
        activeElement.classList.remove("SBHG-bursting");
        activeElement.style.removeProperty("--SBHG-burst-duration");

        if (activeOverflow) {
          if (activeOverflow.value) {
            activeElement.style.setProperty(
              "overflow",
              activeOverflow.value,
              activeOverflow.priority
            );
          } else {
            activeElement.style.removeProperty("overflow");
          }
        }
      }

      activeElement = null;
      activeLayer = null;
      activeOverflow = null;
    }

    function burst(element, options) {
      options = options || {};

      if (!eligible(element) || activeElement) {
        return false;
      }

      const now = performance.now();
      const previous = lastBurst.get(element);

      if (previous !== undefined && now - previous < 4000) {
        return false;
      }

      const micro = options.micro === true;
      const duration = options.duration || (
        micro ? Math.round(random(120, 200)) : Math.round(random(220, 420))
      );

      const intensity = Math.max(
        0,
        Math.min(1, Number(options.intensity) || 0)
      );

      const count = micro ? 3 : Math.floor(random(3, 7));
      const maximumDisplacement = micro ? 4 + intensity * 3 : 8 + intensity * 6;
      const layer = document.createElement("div");

      layer.className = "SBHG-glitch-layer";
      layer.setAttribute("aria-hidden", "true");
      layer.setAttribute("inert", "");

      for (let index = 0; index < count; index += 1) {
        const slice = document.createElement("div");
        const top = 5 + index * (85 / count) + random(0, 5);
        const height = random(3, micro ? 8 : 13);
        const bottom = Math.min(98, top + height);

        const displacement =
          (Math.random() > 0.5 ? 1 : -1) *
          random(2, maximumDisplacement);

        slice.className = "SBHG-glitch-slice";
        slice.style.clipPath =
          "polygon(0 " + top + "%,100% " + top +
          "%,100% " + bottom + "%,0 " + bottom + "%)";

        slice.style.setProperty(
          "--SBHG-slice-x",
          displacement.toFixed(2) + "px"
        );

        slice.appendChild(sanitizeClone(element.cloneNode(true)));
        layer.appendChild(slice);
      }

      if (!micro && Math.random() < 0.35) {
        const sync = document.createElement("span");

        sync.className = "SBHG-glitch-sync";
        sync.style.top = random(20, 80).toFixed(2) + "%";
        layer.appendChild(sync);
      }

      activeOverflow = {
        value: element.style.getPropertyValue("overflow"),
        priority: element.style.getPropertyPriority("overflow")
      };

      element.style.overflow = "hidden";

      if (window.CSS && CSS.supports("overflow", "clip")) {
        element.style.overflow = "clip";
      }

      element.style.setProperty("--SBHG-burst-duration", duration + "ms");
      element.appendChild(layer);
      element.classList.add("SBHG-bursting");

      activeElement = element;
      activeLayer = layer;
      lastBurst.set(element, now);

      activeTimer = window.setTimeout(finishActive, duration + 30);
      return true;
    }

    function clearSchedule() {
      window.clearTimeout(scheduledTimer);
      scheduledTimer = 0;
    }

    function schedule() {
      clearSchedule();

      if (
        reducedMotion.matches ||
        document.hidden ||
        scheduledStopped ||
        finalRequested
      ) {
        return;
      }

      scheduledTimer = window.setTimeout(function () {
        scheduledTimer = 0;

        const targets = Array.from(
          document.querySelectorAll("[data-glitch]")
        ).filter(function (element) {
          return (
            !element.closest(".SBHG-footer") &&
            eligible(element) &&
            !element.closest(".SBHG-menu[hidden]")
          );
        });

        if (targets.length) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          burst(target, { intensity: 0.45 });
        }

        schedule();
      }, Math.round(random(7000, 11000)));
    }

    function decode(element) {
      if (
        !element ||
        seenHeadings.has(element)
      ) {
        return;
      }

      seenHeadings.add(element);

      if (reducedMotion.matches) {
        return;
      }

      const finalText = element.textContent;
      const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]#";
      const duration = Math.round(random(400, 600));
      const start = performance.now();
      const previousAriaLabel = element.getAttribute("aria-label");

      if (element.getAttribute("aria-hidden") !== "true") {
        element.setAttribute("aria-label", finalText);
      }

      const job = {
        element: element,
        timer: 0,
        finalText: finalText,
        previousAriaLabel: previousAriaLabel,
        restore: null
      };

      function restore() {
        window.clearTimeout(job.timer);
        element.textContent = finalText;

        if (element.getAttribute("aria-hidden") !== "true") {
          if (previousAriaLabel === null) {
            element.removeAttribute("aria-label");
          } else {
            element.setAttribute("aria-label", previousAriaLabel);
          }
        }

        decodeJobs.delete(job);
      }

      job.restore = restore;
      decodeJobs.add(job);

      function tick() {
        if (reducedMotion.matches || document.hidden || !element.isConnected) {
          restore();
          return;
        }

        const progress = Math.min(1, (performance.now() - start) / duration);
        const resolved = Math.floor(finalText.length * progress);

        element.textContent = Array.from(finalText).map(function (character, index) {
          if (index < resolved || /\s/.test(character)) {
            return character;
          }

          return glyphs[Math.floor(Math.random() * glyphs.length)];
        }).join("");

        if (progress < 1) {
          job.timer = window.setTimeout(tick, 30);
        } else {
          restore();
        }
      }

      tick();
    }

    function finalizeFooter(element) {
      if (finalDone || reducedMotion.matches) {
        finalDone = true;
        scheduledStopped = true;
        clearSchedule();
        return;
      }

      if (finalRequested) {
        return;
      }

      finalRequested = true;
      clearSchedule();

      function tryFinal() {
        finalTimer = 0;

        if (reducedMotion.matches) {
          finalDone = true;
          scheduledStopped = true;
          return;
        }

        if (document.hidden || !visible(element)) {
          return;
        }

        const now = performance.now();
        const previous = lastBurst.get(element);
        const cooldown = previous === undefined
          ? 0
          : Math.max(0, 4000 - (now - previous));

        if (activeElement || cooldown > 0) {
          finalTimer = window.setTimeout(
            tryFinal,
            Math.max(60, Math.ceil(cooldown))
          );
          return;
        }

        if (burst(element, { duration: 280, intensity: 0.35 })) {
          finalDone = true;
          scheduledStopped = true;
        }
      }

      tryFinal();
    }

    function init() {
      if (initialized) {
        return;
      }

      initialized = true;

      document.addEventListener("pointerover", function (event) {
        if (!(event.target instanceof Element)) {
          return;
        }

        const tile = event.target.closest("[data-tile]");

        if (
          tile &&
          (!event.relatedTarget || !tile.contains(event.relatedTarget))
        ) {
          burst(tile, { micro: true, duration: 160 });
        }
      });

      document.addEventListener("click", function (event) {
        if (!(event.target instanceof Element)) {
          return;
        }

        const target = event.target.closest("[data-hit]");

        if (!target || target.matches(":disabled")) {
          return;
        }

        burst(target, { micro: true, duration: 160 });
      });

      document.addEventListener("visibilitychange", function () {
        clearSchedule();
        window.clearTimeout(finalTimer);
        finalTimer = 0;

        if (document.hidden) {
          finishActive();
          Array.from(decodeJobs).forEach(function (job) {
            job.restore();
          });
        } else if (!finalRequested) {
          schedule();
        } else if (!finalDone) {
          finalRequested = false;

          const mark = document.querySelector(".SBHG-footer-mark");
          if (mark) {
            finalizeFooter(mark);
          }
        }
      });

      reducedMotion.addEventListener("change", function () {
        clearSchedule();

        if (reducedMotion.matches) {
          finishActive();
          Array.from(decodeJobs).forEach(function (job) {
            job.restore();
          });
        } else {
          schedule();
        }
      });

      schedule();
    }

    return {
      init: init,
      burst: burst,
      decode: decode,
      finalizeFooter: finalizeFooter,
      stopScheduled: function () {
        scheduledStopped = true;
        clearSchedule();
      }
    };
  })();
})();
