// ===============================
// Smithworks' SW Cards module.js
// SW Category: Sections
// Master version number: 2026.09.17.13.23
// Changelog: ../CHANGELOG.md
// ===============================

(function () {
  'use strict';

  var SVO_SHAPE_CAP = 400;
  var SVO_APPEAR_FADE_MS = 110;
  var SVO_TWINKLE_FADE_MS = 500;
  var SVO_LEAF = 'path, rect, circle, ellipse, polygon, polyline, line, use';
  var SVO_TWINKLE = {
    low: { count: 2, interval: 1000 },
    medium: { count: 5, interval: 1000 },
    high: { count: 5, interval: 750 }
  };

  function svoReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function svoDecodeMarkup(raw) {
    var s = String(raw || '').replace(/^\uFEFF/, '').trim();
    if (!s) return '';
    if (s.indexOf('<') === -1 && s.indexOf('&lt;') !== -1) {
      var ta = document.createElement('textarea');
      ta.innerHTML = s;
      s = ta.value;
    }
    return s;
  }

  function svoSanitize(markup) {
    var parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    if (parsed.documentElement.nodeName === 'parsererror') return null;
    var svg = parsed.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg') return null;
    var kill = svg.querySelectorAll('script, foreignObject, iframe, embed, object, handler');
    var k;
    for (k = 0; k < kill.length; k++) {
      if (kill[k].parentNode) kill[k].parentNode.removeChild(kill[k]);
    }
    var walk = svg.querySelectorAll('*');
    var i;
    for (i = 0; i < walk.length; i++) {
      var el = walk[i];
      var attrs = [];
      var a;
      for (a = 0; a < el.attributes.length; a++) {
        attrs.push(el.attributes[a].name);
      }
      for (a = 0; a < attrs.length; a++) {
        var name = attrs[a];
        var val = el.getAttribute(name) || '';
        if (/^on/i.test(name) || /javascript:/i.test(val) || /data:/i.test(val) && /script/i.test(val)) {
          el.removeAttribute(name);
        }
      }
    }
    return svg;
  }

  function svoLeaves(svg) {
    var nodes = svg.querySelectorAll(SVO_LEAF);
    var out = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.closest('defs, clipPath, mask, filter, linearGradient, radialGradient, pattern, marker, symbol')) {
        continue;
      }
      out.push(n);
    }
    return out;
  }

  function svoApplyOverride(svg, color) {
    if (!color) return;
    var nodes = svoLeaves(svg);
    var i;
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var fill = (n.getAttribute('fill') || '').trim().toLowerCase();
      var stroke = (n.getAttribute('stroke') || '').trim();
      if (fill !== 'none') {
        n.setAttribute('fill', color);
      }
      if (stroke && stroke.toLowerCase() !== 'none') {
        n.setAttribute('stroke', color);
      }
    }
  }

  function svoPick(shapes, count, busy) {
    var pool = [];
    var i;
    for (i = 0; i < shapes.length; i++) {
      if (!busy[i]) pool.push(i);
    }
    var picks = [];
    var c = Math.min(count, pool.length);
    while (picks.length < c && pool.length) {
      var r = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(r, 1)[0]);
    }
    return picks;
  }

  function svoTwinkleWave(shapes, bases, busy, spec) {
    var picks = svoPick(shapes, spec.count, busy);
    var holdMs = spec.interval * 2;
    var fadeMs = SVO_TWINKLE_FADE_MS;
    var p;
    for (p = 0; p < picks.length; p++) {
      (function (idx) {
        busy[idx] = true;
        var el = shapes[idx];
        el.style.transition = 'opacity ' + fadeMs + 'ms ease-in-out';
        el.style.opacity = '0';
        window.setTimeout(function () {
          window.setTimeout(function () {
            el.style.opacity = String(bases[idx]);
            window.setTimeout(function () {
              busy[idx] = false;
            }, fadeMs);
          }, holdMs);
        }, fadeMs);
      })(picks[p]);
    }
  }

  function svoStartTwinkle(shapes, bases) {
    var key = 'medium';
    var root = shapes.length ? shapes[0].closest('[data-sw-cards-svg-overlay]') : null;
    if (root) key = root.getAttribute('data-twinkle') || 'medium';
    var spec = SVO_TWINKLE[key] || SVO_TWINKLE.medium;
    var busy = {};
    svoTwinkleWave(shapes, bases, busy, spec);
    return window.setInterval(function () {
      svoTwinkleWave(shapes, bases, busy, spec);
    }, spec.interval);
  }

  function svoMount(root) {
    if (!root || root.getAttribute('data-svo-ready') === '1') return;
    var src = root.querySelector('.sw-cards__svg-overlay-src');
    var graphic = root.querySelector('.sw-cards__svg-overlay-graphic');
    if (!src || !graphic) return;
    var markup = svoDecodeMarkup(src.textContent);
    src.parentNode.removeChild(src);
    if (!markup) return;
    var svg = svoSanitize(markup);
    if (!svg) return;
    var par = root.getAttribute('data-par') || 'xMidYMid meet';
    svg.setAttribute('preserveAspectRatio', par);
    if (!svg.getAttribute('overflow')) svg.setAttribute('overflow', 'visible');
    if (root.classList.contains('is-svo-override')) {
      var cs = window.getComputedStyle(root);
      svoApplyOverride(svg, (cs.getPropertyValue('--sw-svo-color') || '').trim());
    }
    graphic.appendChild(document.importNode(svg, true));
    var live = graphic.querySelector('svg');
    if (!live) return;
    var leaves = svoLeaves(live);
    var animatable = leaves.slice(0, SVO_SHAPE_CAP);
    var rest = leaves.slice(SVO_SHAPE_CAP);
    var bases = [];
    var i;
    for (i = 0; i < animatable.length; i++) {
      animatable[i].classList.add('sw-svo-shape');
      var op = animatable[i].getAttribute('opacity');
      bases[i] = op === null || op === '' ? 1 : Number(op);
      if (isNaN(bases[i])) bases[i] = 1;
    }
    var reduce = svoReducedMotion();
    var mode = root.getAttribute('data-anim') || 'appear';
    if (reduce) {
      root.setAttribute('data-svo-ready', '1');
      return;
    }
    if (mode === 'appear' || mode === 'both') {
      var duration = Number(root.getAttribute('data-appear'));
      if (!duration || duration < 0.2) duration = 1;
      var windowMs = duration * 1000;
      for (i = 0; i < animatable.length; i++) {
        animatable[i].style.opacity = '0';
      }
      for (i = 0; i < animatable.length; i++) {
        (function (el, base, delay) {
          window.setTimeout(function () {
            el.style.opacity = String(base);
          }, delay);
        })(animatable[i], bases[i], Math.floor(Math.random() * windowMs));
      }
      if (mode === 'both') {
        window.setTimeout(function () {
          svoStartTwinkle(animatable, bases);
        }, windowMs + SVO_APPEAR_FADE_MS);
      }
    } else if (mode === 'twinkle') {
      svoStartTwinkle(animatable, bases);
    }
    root.setAttribute('data-svo-ready', '1');
    rest = rest;
  }

  function initSvgOverlays() {
    var nodes = document.querySelectorAll('[data-sw-cards-svg-overlay]');
    var n;
    for (n = 0; n < nodes.length; n++) {
      try {
        svoMount(nodes[n]);
      } catch (err) {}
    }
  }


  function bootSvgOverlays() {
    initSvgOverlays();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSvgOverlays);
  } else {
    bootSvgOverlays();
  }
})();


(function() {
  'use strict';
  
  // oEmbed functionality for external video embeds
  const oembedContainers = document.getElementsByClassName('oembed_container');
  const embedContainers = document.getElementsByClassName('embed_container');

  function loadOEmbed(container) {
    const embedContainer = container;
    const iframeWrapper = embedContainer.querySelector('.iframe_wrapper');
    const customThumbnail = embedContainer.querySelector('.oembed_custom-thumbnail');
    const url = iframeWrapper ? iframeWrapper.dataset.embedUrl : null;

    if (url) {
      var request = new XMLHttpRequest();
      var requestUrl = '/_hcms/oembed?url=' + url + '&autoplay=0';

      request.open('GET', requestUrl, true);
      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          var data = JSON.parse(request.responseText);

          const maxHeight =
            iframeWrapper.dataset.maxHeight !== undefined &&
            !iframeWrapper.dataset.maxHeight
              ? data.height
              : iframeWrapper.dataset.maxHeight;
          const maxWidth =
            iframeWrapper.dataset.maxWidth !== undefined && !iframeWrapper.dataset.maxWidth
              ? data.width
              : iframeWrapper.dataset.maxWidth;
          const height =
            iframeWrapper.dataset.height !== undefined && !iframeWrapper.dataset.height
              ? data.height
              : iframeWrapper.dataset.height;
          const width =
            iframeWrapper.dataset.width !== undefined && !iframeWrapper.dataset.width
              ? data.width
              : iframeWrapper.dataset.width;

          const el = document.createElement('div');
          el.innerHTML = data.html;
          const iframe = el.firstChild;
          iframe.setAttribute('class', 'oembed_container_iframe');
          iframe.setAttribute('title', data.title);

          if (customThumbnail) {
            customThumbnail.onclick = function () {
              const iframeSrc = new URL(iframe.src);
              iframeSrc.searchParams.append('autoplay', 1);
              iframe.src = iframeSrc.toString();
              this.setAttribute('class', 'oembed_custom-thumbnail--hide');
              iframeWrapper.appendChild(iframe);
            };
          } else {
            iframeWrapper.appendChild(iframe);
          }

          if (maxHeight) {
            const maxHeightStr = maxHeight.toString(10) + 'px';
            embedContainer.style.maxHeight = maxHeightStr;
            iframe.style.maxHeight = maxHeightStr;
            if (customThumbnail) {
              customThumbnail.style.maxHeight = maxHeightStr;
            }
          }

          if (maxWidth) {
            const maxWidthStr = maxWidth.toString(10) + 'px';
            embedContainer.style.maxWidth = maxWidthStr;
            iframe.style.maxWidth = maxWidthStr;
            if (customThumbnail) {
              customThumbnail.style.maxWidth = maxWidthStr;
            }
          }

          if (height) {
            const heightStr = height.toString(10) + 'px';
            embedContainer.style.height = heightStr;
            iframe.style.height = heightStr;
            if (customThumbnail) {
              customThumbnail.style.height = heightStr;
            }
          }

          if (width) {
            const widthStr = width.toString(10) + 'px';
            embedContainer.style.width = widthStr;
            iframe.style.width = widthStr;
            if (customThumbnail) {
              customThumbnail.style.width = widthStr;
            }
          }
        } else {
          console.error('Server reached, error retrieving results.');
        }
      };
      request.onerror = function () {
        console.error('Could not reach the server.');
      };
      request.send();
    }
  }

  function loadEmbed(container) {
    const embedContainer = container;
    const iframe = embedContainer.querySelector('.iframe_wrapper iframe');

    if (!iframe) return;

    // Inside SW Cards: let CSS (iframe_wrapper padding-bottom 56.25%, iframe absolute fill) make embed responsive so it fills the card
    if (embedContainer.closest('.sw-cards')) {
      embedContainer.style.width = '100%';
      embedContainer.style.maxWidth = '100%';
      embedContainer.style.maxHeight = '';
      return;
    }

    const maxHeight = iframe.getAttribute('height');
    const maxWidth = iframe.getAttribute('width');

    if (maxHeight !== null) {
      const heightStr = maxHeight.toString(10) + 'px';
      embedContainer.style.maxHeight = heightStr;
    } else {
      iframe.style.height = '100%';
    }

    if (maxWidth !== null) {
      const widthStr = maxWidth.toString(10) + 'px';
      embedContainer.style.maxWidth = widthStr;
    } else {
      iframe.style.width = '100%';
    }
  }

  if (oembedContainers.length !== 0) {
    Array.prototype.forEach.call(oembedContainers, function (el) {
      loadOEmbed(el);
    });
  }

  if (embedContainers.length !== 0) {
    Array.prototype.forEach.call(embedContainers, function (el) {
      loadEmbed(el);
    });
  }

  function startSlideBounce(sliderEl) {
    if (sliderEl.dataset.autoplay === 'true' || sliderEl.dataset.bounce !== 'true') return;
    var track = sliderEl.querySelector('.blaze-track');
    var container = sliderEl.querySelector('.blaze-track-container');
    if (!container || !track || track.children.length <= 1) return;
    var intervalSec = parseInt(sliderEl.dataset.bounceInterval, 10) || 5;
    var intervalMs = intervalSec * 1000;
    setInterval(function () {
      container.classList.add('sw-cards__bounce');
      setTimeout(function () {
        container.classList.remove('sw-cards__bounce');
      }, 500);
    }, intervalMs);
  }

  // Blaze slider init when SW Cards uses slider mode (or continuous scroll marquee)
  document.addEventListener('DOMContentLoaded', function () {
    // Showcase cards: exact +15px each side via non-uniform scale (no layout reflow; 768px+ only)
    (function initShowcaseCards() {
      var PAD = 15;
      var mq = window.matchMedia('(min-width: 768px)');

      function debounce(fn, ms) {
        var t;
        return function () {
          clearTimeout(t);
          var ctx = this;
          var args = arguments;
          t = setTimeout(function () {
            fn.apply(ctx, args);
          }, ms);
        };
      }

      function measureAll() {
        document.querySelectorAll('.sw-cards__card[data-showcase-expand="true"]').forEach(function (card) {
          if (!mq.matches) {
            card.style.removeProperty('--showcase-sx');
            card.style.removeProperty('--showcase-sy');
            return;
          }
          card.style.setProperty('transform', 'none', 'important');
          var w = card.offsetWidth;
          var h = card.offsetHeight;
          card.style.removeProperty('transform');
          if (w > 0 && h > 0) {
            card.style.setProperty('--showcase-sx', String((w + 2 * PAD) / w));
            card.style.setProperty('--showcase-sy', String((h + 2 * PAD) / h));
          }
        });
      }

      var debounced = debounce(measureAll, 120);
      measureAll();
      if (mq.addEventListener) {
        mq.addEventListener('change', measureAll);
      } else if (mq.addListener) {
        mq.addListener(measureAll);
      }
      window.addEventListener('resize', debounced);
      window.addEventListener('load', debounce(measureAll, 80));

      if (typeof ResizeObserver !== 'undefined') {
        document.querySelectorAll('.sw-cards__card[data-showcase-expand="true"]').forEach(function (card) {
          var ro = new ResizeObserver(debounced);
          ro.observe(card);
        });
      }
    })();

    // Gutter 0 and/or Zero inside corners: row classes for inner vertical seams (768px+)
    (function initFuseInsideCorners() {
      var G0 = ['sw-cards__col--g0-only', 'sw-cards__col--g0-start', 'sw-cards__col--g0-end', 'sw-cards__col--g0-mid'];

      function debounceG0(fn, ms) {
        var t;
        return function () {
          clearTimeout(t);
          var ctx = this;
          var args = arguments;
          t = setTimeout(function () {
            fn.apply(ctx, args);
          }, ms);
        };
      }

      function clearG0(col) {
        G0.forEach(function (c) {
          col.classList.remove(c);
        });
      }

      function applyFuseInsideCorners() {
        document.querySelectorAll('.sw-cards[data-fuse-inside-corners="true"]').forEach(function (root) {
          root.querySelectorAll('.sw-cards__grid.row, .sw-cards__slide-page > .row').forEach(function (row) {
            var cols = Array.prototype.filter.call(row.children, function (el) {
              return el.classList.contains('sw-cards__col');
            });
            cols.forEach(clearG0);
            if (!cols.length) return;

            var mq = window.matchMedia('(min-width: 768px)');
            if (!mq.matches) {
              return;
            }

            var groups = [];
            cols.forEach(function (col) {
              var top = Math.round(col.getBoundingClientRect().top);
              var g = groups.find(function (x) {
                return Math.abs(x.top - top) < 8;
              });
              if (!g) {
                g = { top: top, cols: [] };
                groups.push(g);
              }
              g.cols.push(col);
            });

            groups.forEach(function (g) {
              g.cols.sort(function (a, b) {
                return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
              });
              if (g.cols.length === 1) {
                g.cols[0].classList.add('sw-cards__col--g0-only');
              } else {
                g.cols.forEach(function (col, i) {
                  if (i === 0) {
                    col.classList.add('sw-cards__col--g0-start');
                  } else if (i === g.cols.length - 1) {
                    col.classList.add('sw-cards__col--g0-end');
                  } else {
                    col.classList.add('sw-cards__col--g0-mid');
                  }
                });
              }
            });
          });
        });
      }

      var debouncedG0 = debounceG0(applyFuseInsideCorners, 100);
      applyFuseInsideCorners();
      window.addEventListener('resize', debouncedG0);
      window.addEventListener('load', debounceG0(applyFuseInsideCorners, 60));

      var mq768 = window.matchMedia('(min-width: 768px)');
      if (mq768.addEventListener) {
        mq768.addEventListener('change', applyFuseInsideCorners);
      } else if (mq768.addListener) {
        mq768.addListener(applyFuseInsideCorners);
      }

      if (typeof ResizeObserver !== 'undefined') {
        document.querySelectorAll('.sw-cards[data-fuse-inside-corners="true"] .sw-cards__grid.row, .sw-cards[data-fuse-inside-corners="true"] .sw-cards__slide-page > .row').forEach(function (row) {
          var ro = new ResizeObserver(debouncedG0);
          ro.observe(row);
        });
      }
    })();

    const blazeSliders = document.querySelectorAll('.sw-cards .blaze-slider');
    const blazeSlidersNeedingInit = [];

    blazeSliders.forEach(function (el) {
      const continuousScroll = el.dataset.continuousScroll === 'true';
      const track = el.querySelector('.blaze-track');

      if (continuousScroll && track && track.children.length > 0) {
        // Continuous scroll: clone slides for seamless marquee, don't init Blaze
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < track.children.length; i++) {
          fragment.appendChild(track.children[i].cloneNode(true));
        }
        track.appendChild(fragment);

        // JS-driven marquee: measure one set width, animate with requestAnimationFrame, reset at loop point
        requestAnimationFrame(function () {
          var oneSetWidth = track.scrollWidth / 2;
          var numCards = track.children.length / 2;
          var intervalSec = parseInt(el.dataset.autoplayspeed, 10) || 5;
          var durationMs = intervalSec * 1000 * numCards;
          var startTime = null;
          var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

          if (prefersReducedMotion || oneSetWidth <= 0) return;

          function animate(now) {
            if (!startTime) startTime = now;
            var elapsed = now - startTime;
            var translateX = -(oneSetWidth * (elapsed / durationMs));
            if (translateX <= -oneSetWidth) {
              translateX = 0;
              startTime = now;
            }
            track.style.transform = 'translateX(' + translateX + 'px)';
            requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
        });
        return;
      }

      blazeSlidersNeedingInit.push(el);
    });

    function tryInitBlaze(attemptsLeft) {
      if (typeof BlazeSlider !== 'undefined') {
        blazeSlidersNeedingInit.forEach(function (el) {
          var slidesToShowXL = parseInt(el.dataset.stsXl, 10) || 1;
          var slidesToShowLG = parseInt(el.dataset.stsLg, 10) || slidesToShowXL;
          var slidesToShowMD = parseInt(el.dataset.stsMd, 10) || slidesToShowLG;
          var slidesToShowSM = parseInt(el.dataset.stsSm, 10) || 1;
          var slideGap = (el.dataset.slideGap && el.dataset.slideGap !== '') ? (el.dataset.slideGap + 'px') : '30px';
          var autoplayIntervalMs = (parseInt(el.dataset.autoplayspeed, 10) || 5) * 1000;
          var smoothScroll = el.dataset.smoothScroll === 'true';
          var transitionDuration = smoothScroll ? autoplayIntervalMs : 300;
          new BlazeSlider(el, {
            all: {
              draggable: true,
              enableAutoplay: el.dataset.autoplay === 'true',
              autoplayInterval: autoplayIntervalMs,
              slideGap: slideGap,
              transitionDuration: transitionDuration,
              slidesToShow: slidesToShowXL
            },
            '(max-width: 1199px)': { slidesToShow: slidesToShowLG },
            '(max-width: 991px)': { slidesToShow: slidesToShowMD },
            '(max-width: 767px)': { slidesToShow: slidesToShowSM }
          });
          startSlideBounce(el);
        });
        return;
      }
      if (attemptsLeft > 0) {
        setTimeout(function () { tryInitBlaze(attemptsLeft - 1); }, 100);
      }
    }
    tryInitBlaze(20);

    // Video modal: open on trigger, move content into slot; close on button/overlay, move back and pause
    const videoModalTriggers = document.querySelectorAll('.sw-cards [data-video-open-modal]');
    videoModalTriggers.forEach(function (trigger) {
      const targetId = trigger.getAttribute('data-target');
      const contentId = trigger.getAttribute('data-video-content-id');
      if (!targetId || !contentId) return;
      const modal = document.querySelector(targetId);
      const sourceEl = document.getElementById(contentId);
      if (!modal || !sourceEl) return;
      const slot = modal.querySelector('.sw-cards-video-modal-slot');
      const closeBtn = modal.querySelector('.sw-cards-video-modal-close');
      if (!slot) return;

      function openModal() {
        while (sourceEl.firstChild) {
          slot.appendChild(sourceEl.firstChild);
        }
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        var v = slot.querySelector('video');
        if (v) {
          v.play().catch(function () {});
        }
        var oembed = slot.querySelector('.oembed_container');
        if (oembed && typeof loadOEmbed === 'function') {
          loadOEmbed(oembed);
        } else if (oembed && slot.querySelector('.iframe_wrapper') && !slot.querySelector('.iframe_wrapper iframe')) {
          loadOEmbed(oembed);
        }
      }
      function closeModal() {
        var v = slot.querySelector('video');
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
        while (slot.firstChild) {
          sourceEl.appendChild(slot.firstChild);
        }
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
      }

      trigger.addEventListener('click', openModal);
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal();
        }
      });
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeModal();
          }
        });
      }
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    });
  });

})();

/**
 * Module Outer Animated (Roll + Wave). Outer fill only.
 * Keep this file free of HubL delimiters (no double-brace / percent-brace).
 */
(function () {
  'use strict';

  var PRIMITIVE_CAP = 120;
  var STAMP_CAP = 700;
  var SAMPLES_PATH_ROLL = 120;
  var SAMPLES_PATH_WAVE = 160;
  var SAMPLES_CIRCLE = 24;
  var DISC_SEGS = 14;
  var END_EXTEND_FRAC = 0.42;
  var FRAME_X_WAVE = 0.62;
  var FRAME_Y_WAVE = 0.38;
  var FRAME_X_FULL = 1.05;
  var FRAME_Y_FULL = 1.05;
  var SURFACE_BUMP = 55;
  var DEFAULT_COLOR = [202 / 255, 53 / 255, 33 / 255, 0.92];

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function isStaticEnv() {
    if (window.hsInEditor) return true;
    if (prefersReducedMotion()) return true;
    if (!window.matchMedia) return false;
    if (window.matchMedia('(pointer: coarse)').matches) return true;
    if (window.matchMedia('(max-width: 767px)').matches) return true;
    return false;
  }

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function createProgram(gl, vsSrc, fsSrc) {
    var vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
    var fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  }

  function parseColor(str, fallback) {
    if (str == null) return fallback || null;
    str = String(str).trim();
    if (!str || str === 'none' || str === 'transparent') return fallback || null;
    var m = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (m) {
      return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255, m[4] != null ? Number(m[4]) : 1];
    }
    m = str.match(/^#([0-9a-f]{6})$/i);
    if (m) {
      var n = parseInt(m[1], 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
    }
    m = str.match(/^#([0-9a-f]{3})$/i);
    if (m) {
      var h = m[1];
      return [
        parseInt(h.charAt(0) + h.charAt(0), 16) / 255,
        parseInt(h.charAt(1) + h.charAt(1), 16) / 255,
        parseInt(h.charAt(2) + h.charAt(2), 16) / 255,
        1
      ];
    }
    return fallback || null;
  }

  function styleMap(el) {
    var out = {};
    var s = el.getAttribute('style');
    if (!s) return out;
    var parts = s.split(';');
    var i;
    for (i = 0; i < parts.length; i++) {
      var p = parts[i];
      var ix = p.indexOf(':');
      if (ix < 1) continue;
      var k = p.slice(0, ix).trim().toLowerCase();
      var v = p.slice(ix + 1).trim();
      if (k) out[k] = v;
    }
    return out;
  }

  function attrOrStyle(el, name) {
    var a = el.getAttribute(name);
    if (a != null && String(a).trim() !== '') return a;
    var st = styleMap(el);
    return st[name] || '';
  }

  function ownOpacity(el) {
    var v = parseFloat(attrOrStyle(el, 'opacity'));
    return isFinite(v) ? v : 1;
  }

  function stackedOpacity(el) {
    var a = 1;
    var node = el;
    while (node && node.nodeType === 1) {
      a *= ownOpacity(node);
      var tag = (node.tagName || '').toLowerCase();
      if (tag === 'svg') break;
      node = node.parentNode;
    }
    var fo = parseFloat(attrOrStyle(el, 'fill-opacity'));
    if (isFinite(fo)) a *= fo;
    if (a < 0) a = 0;
    if (a > 1) a = 1;
    return a;
  }

  function primitiveColor(el) {
    var c =
      parseColor(attrOrStyle(el, 'stroke')) ||
      parseColor(attrOrStyle(el, 'fill')) ||
      DEFAULT_COLOR.slice();
    var op = stackedOpacity(el);
    var out = [c[0], c[1], c[2], (c[3] != null ? c[3] : 1) * op];
    out.op = op;
    return out;
  }

  function inHiddenSvgBranch(el) {
    if (!el || !el.closest) return false;
    return !!(el.closest('defs') || el.closest('clipPath') || el.closest('mask') || el.closest('pattern') || el.closest('symbol'));
  }

  function fillIsNone(el) {
    var f = (el.getAttribute('fill') || '').trim().toLowerCase();
    return f === 'none';
  }

  function isStrokeRibbon(el) {
    if (!el || !el.getAttribute) return false;
    var stroke = (el.getAttribute('stroke') || '').trim();
    return fillIsNone(el) && stroke && stroke.toLowerCase() !== 'none';
  }

  function artEngine(art) {
    if (art === 'circular-dots' || art === 'dot-waves') return 'stamp';
    return 'ribbon';
  }

  function samplePathElement(el, samples, extendFrac) {
    if (!el.getTotalLength) return null;
    var total = el.getTotalLength();
    if (!total || !isFinite(total)) return null;
    var extend = total * (extendFrac || 0);
    var span = total + extend * 2;
    var pts = new Float32Array(samples * 2);
    var i;
    for (i = 0; i < samples; i++) {
      var dist = -extend + (i / (samples - 1)) * span;
      var p;
      var p1;
      var p0;
      var dx;
      var dy;
      var len;
      if (dist < 0) {
        p = el.getPointAtLength(0);
        p1 = el.getPointAtLength(Math.min(total * 0.02, total));
        dx = p.x - p1.x;
        dy = p.y - p1.y;
        len = Math.hypot(dx, dy) || 1;
        pts[i * 2] = p.x + (dx / len) * (-dist);
        pts[i * 2 + 1] = p.y + (dy / len) * (-dist);
      } else if (dist > total) {
        p = el.getPointAtLength(total);
        p0 = el.getPointAtLength(Math.max(total * 0.98, 0));
        dx = p.x - p0.x;
        dy = p.y - p0.y;
        len = Math.hypot(dx, dy) || 1;
        pts[i * 2] = p.x + (dx / len) * (dist - total);
        pts[i * 2 + 1] = p.y + (dy / len) * (dist - total);
      } else {
        p = el.getPointAtLength(dist);
        pts[i * 2] = p.x;
        pts[i * 2 + 1] = p.y;
      }
    }
    return pts;
  }

  function sampleCircle(el, samples) {
    var cx = parseFloat(el.getAttribute('cx') || '0');
    var cy = parseFloat(el.getAttribute('cy') || '0');
    var r = parseFloat(el.getAttribute('r') || '0');
    if (!r || !isFinite(r)) return null;
    var pts = new Float32Array(samples * 2);
    var i;
    for (i = 0; i < samples; i++) {
      var a = (i / (samples - 1)) * Math.PI * 2;
      pts[i * 2] = cx + Math.cos(a) * r;
      pts[i * 2 + 1] = cy + Math.sin(a) * r;
    }
    return pts;
  }

  function strokeMesh(pts, halfWidth) {
    var n = pts.length / 2;
    if (n < 2) return null;
    var verts = new Float32Array(n * 4);
    var i;
    for (i = 0; i < n; i++) {
      var i0 = Math.max(0, i - 1);
      var i1 = Math.min(n - 1, i + 1);
      var x = pts[i * 2];
      var y = pts[i * 2 + 1];
      var x0 = pts[i0 * 2];
      var y0 = pts[i0 * 2 + 1];
      var x1 = pts[i1 * 2];
      var y1 = pts[i1 * 2 + 1];
      var dx = x1 - x0;
      var dy = y1 - y0;
      var inv = 1 / Math.max(Math.hypot(dx, dy), 1e-4);
      var nx = -dy * inv * halfWidth;
      var ny = dx * inv * halfWidth;
      var vi = i * 4;
      verts[vi] = x + nx;
      verts[vi + 1] = y + ny;
      verts[vi + 2] = x - nx;
      verts[vi + 3] = y - ny;
    }
    return verts;
  }

  function discMesh(cx, cy, r, segs) {
    if (!isFinite(cx) || !isFinite(cy) || !r || r <= 0) return null;
    segs = segs || DISC_SEGS;
    var verts = new Float32Array((segs + 2) * 2);
    verts[0] = cx;
    verts[1] = cy;
    var i;
    for (i = 0; i <= segs; i++) {
      var a = (i / segs) * Math.PI * 2;
      verts[(i + 1) * 2] = cx + Math.cos(a) * r;
      verts[(i + 1) * 2 + 1] = cy + Math.sin(a) * r;
    }
    return verts;
  }

  function visiblePaintNodes(svg) {
    var nodes = svg.querySelectorAll('path, circle, ellipse');
    var out = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (!inHiddenSvgBranch(nodes[i])) out.push(nodes[i]);
    }
    return out;
  }

  function evenStride(list, cap) {
    var n = list.length;
    if (!n) return [];
    if (n <= cap) return list.slice();
    var stride = Math.max(1, Math.floor(n / cap));
    var picked = [];
    var i;
    for (i = 0; i < n && picked.length < cap; i += stride) {
      picked.push(list[i]);
    }
    return picked;
  }

  function pathSubpathCount(d) {
    if (!d) return 0;
    var m = d.match(/[Mm]/g);
    return m ? m.length : 0;
  }

  function stampFromNumbers(nums) {
    if (!nums || nums.length < 2) return null;
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    var sx = 0;
    var sy = 0;
    var c = 0;
    var i;
    for (i = 0; i + 1 < nums.length; i += 2) {
      var x = nums[i];
      var y = nums[i + 1];
      if (!isFinite(x) || !isFinite(y)) continue;
      sx += x;
      sy += y;
      c += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (!c) return null;
    var cx = sx / c;
    var cy = sy / c;
    var r = Math.max((maxX - minX) * 0.5, (maxY - minY) * 0.5, 1.5);
    return { cx: cx, cy: cy, r: r };
  }

  function parsePathNumbers(d) {
    var out = [];
    var re = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
    var m;
    while ((m = re.exec(d))) {
      out.push(parseFloat(m[0]));
    }
    return out;
  }

  function stampsFromPathEl(el) {
    var d = el.getAttribute('d') || '';
    var parts = d.split(/(?=[Mm])/);
    var stamps = [];
    var i;
    if (parts.length >= 3) {
      for (i = 0; i < parts.length; i++) {
        var piece = parts[i].trim();
        if (!piece) continue;
        var st = stampFromNumbers(parsePathNumbers(piece));
        if (st) stamps.push(st);
      }
      return stamps;
    }
    var one = stampFromNumbers(parsePathNumbers(d));
    return one ? [one] : [];
  }

  function stampFromCircleEl(el) {
    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    var cx = parseFloat(el.getAttribute('cx') || '0');
    var cy = parseFloat(el.getAttribute('cy') || '0');
    var r;
    if (tag === 'ellipse') {
      var rx = parseFloat(el.getAttribute('rx') || '0');
      var ry = parseFloat(el.getAttribute('ry') || '0');
      r = (rx + ry) * 0.5;
    } else {
      r = parseFloat(el.getAttribute('r') || '0');
    }
    if (!isFinite(cx) || !isFinite(cy) || !r || r <= 0) return null;
    return { cx: cx, cy: cy, r: r };
  }

  function collectStamps(nodes) {
    var raw = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var tag = el.tagName ? el.tagName.toLowerCase() : '';
      var color = primitiveColor(el);
      if (tag === 'circle' || tag === 'ellipse') {
        var sc = stampFromCircleEl(el);
        if (sc) {
          sc.color = color;
          raw.push(sc);
        }
        continue;
      }
      var many = stampsFromPathEl(el);
      var si;
      for (si = 0; si < many.length; si++) {
        many[si].color = color;
        raw.push(many[si]);
      }
    }
    return evenStride(raw, STAMP_CAP);
  }

  function sampleCountForPath(el, base) {
    if (!el.getTotalLength) return base;
    var len = el.getTotalLength();
    if (!len || !isFinite(len)) return base;
    return Math.min(220, Math.max(base, Math.round(len / 50)));
  }

  function halfWidthFor(el) {
    var sw = parseFloat(el.getAttribute('stroke-width') || '');
    if (sw && isFinite(sw) && sw > 0) return sw * 0.55;
    if (el.tagName && el.tagName.toLowerCase() === 'circle') {
      var r = parseFloat(el.getAttribute('r') || '4') || 4;
      return Math.max(r, 1);
    }
    return 1 * 0.55;
  }

  function shouldStampElement(el, engine) {
    if (engine === 'stamp') return true;
    if (engine === 'ribbon') return false;
    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'circle' || tag === 'ellipse') return true;
    if (isStrokeRibbon(el)) return false;
    return pathSubpathCount(el.getAttribute('d') || '') >= 3;
  }

  var FS =
    'precision mediump float;\n' +
    'uniform vec4 u_color;\n' +
    'void main(){ gl_FragColor = u_color; }\n';

  var VS_ROLL =
    'attribute vec2 a_pos;\n' +
    'uniform vec2 u_artCenter;\n' +
    'uniform vec2 u_artHalf;\n' +
    'uniform float u_time;\n' +
    'uniform float u_rollSpeed;\n' +
    'uniform float u_frameX;\n' +
    'uniform float u_frameY;\n' +
    'void main(){\n' +
    '  vec2 c = u_artCenter;\n' +
    '  float halfH = max(u_artHalf.y, 1.0);\n' +
    '  float halfW = max(u_artHalf.x, 1.0);\n' +
    '  float R = halfH * 0.85;\n' +
    '  float pitch = u_time * u_rollSpeed;\n' +
    '  float yNorm = clamp((a_pos.y - c.y) / halfH, -1.15, 1.15);\n' +
    '  float theta0 = yNorm * 0.9;\n' +
    '  float theta = theta0 + pitch;\n' +
    '  float bump = sin(a_pos.x * 0.0013 + pitch * 2.3) * ' + SURFACE_BUMP.toFixed(1) + ';\n' +
    '  bump += sin(a_pos.x * 0.0005 - pitch * 1.1) * 28.0;\n' +
    '  float rad = R + bump;\n' +
    '  float yC = rad * sin(theta);\n' +
    '  float zC = rad * cos(theta);\n' +
    '  float yPin = R * sin(pitch);\n' +
    '  float zPin = R * cos(pitch);\n' +
    '  float yLocal = yC - yPin;\n' +
    '  float zLocal = zC - zPin;\n' +
    '  float camDist = R * 3.2;\n' +
    '  float persp = camDist / max(camDist * 0.55, camDist - zLocal);\n' +
    '  float x0 = a_pos.x - c.x;\n' +
    '  vec2 p;\n' +
    '  p.x = c.x + x0 * persp;\n' +
    '  p.y = c.y + yLocal * persp;\n' +
    '  vec2 frameHalf = vec2(halfW * u_frameX, halfH * u_frameY);\n' +
    '  vec2 uv = (p - c) / frameHalf;\n' +
    '  uv = uv * 0.5 + 0.5;\n' +
    '  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);\n' +
    '  if (camDist - zLocal < camDist * 0.2) {\n' +
    '    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);\n' +
    '  }\n' +
    '}\n';

  var VS_WAVE =
    'attribute vec2 a_pos;\n' +
    'uniform vec2 u_artCenter;\n' +
    'uniform vec2 u_artHalf;\n' +
    'uniform float u_time;\n' +
    'uniform float u_speed;\n' +
    'uniform float u_amp;\n' +
    'uniform float u_lineLag;\n' +
    'uniform float u_lineIndex;\n' +
    'uniform float u_lineCount;\n' +
    'uniform float u_frameX;\n' +
    'uniform float u_frameY;\n' +
    'void main(){\n' +
    '  vec2 c = u_artCenter;\n' +
    '  float halfH = max(u_artHalf.y, 1.0);\n' +
    '  float halfW = max(u_artHalf.x, 1.0);\n' +
    '  float x0 = a_pos.x - c.x;\n' +
    '  float xN = x0 / halfW;\n' +
    '  float lineN = u_lineCount > 1.0 ? (u_lineIndex / (u_lineCount - 1.0)) : 0.0;\n' +
    '  float phase = xN * 3.14159265 - u_time * u_speed + lineN * u_lineLag * 6.2831853;\n' +
    '  float ripple = sin(phase) * u_amp;\n' +
    '  ripple += sin(phase * 2.0 + 0.4) * (u_amp * 0.28);\n' +
    '  float env = smoothstep(-1.05, -0.15, xN) * smoothstep(1.05, 0.15, xN);\n' +
    '  env = max(env, 0.35);\n' +
    '  vec2 p;\n' +
    '  p.x = a_pos.x;\n' +
    '  p.y = a_pos.y + ripple * env;\n' +
    '  vec2 frameHalf = vec2(halfW * u_frameX, halfH * u_frameY + u_amp * 0.22);\n' +
    '  vec2 uv = (p - c) / frameHalf;\n' +
    '  uv = uv * 0.5 + 0.5;\n' +
    '  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);\n' +
    '}\n';

  function stageColor(stage) {
    var cs = window.getComputedStyle(stage);
    return parseColor(cs.color, DEFAULT_COLOR);
  }

  function expandBounds(b, x, y) {
    if (x < b.minX) b.minX = x;
    if (x > b.maxX) b.maxX = x;
    if (y < b.minY) b.minY = y;
    if (y > b.maxY) b.maxY = y;
  }

  function startEngine(canvas, svg, opts) {
    opts = opts || {};
    var motion = opts.motion === 'roll' ? 'roll' : 'wave';
    var art = opts.art || 'wave';
    var engine = artEngine(art);
    var gl =
      canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        powerPreference: 'high-performance'
      }) ||
      canvas.getContext('experimental-webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return null;

    var prog = createProgram(gl, motion === 'roll' ? VS_ROLL : VS_WAVE, FS);
    if (!prog) return null;

    var aPos = gl.getAttribLocation(prog, 'a_pos');
    var uArtCenter = gl.getUniformLocation(prog, 'u_artCenter');
    var uArtHalf = gl.getUniformLocation(prog, 'u_artHalf');
    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uColor = gl.getUniformLocation(prog, 'u_color');
    var uRollSpeed = gl.getUniformLocation(prog, 'u_rollSpeed');
    var uSpeed = gl.getUniformLocation(prog, 'u_speed');
    var uAmp = gl.getUniformLocation(prog, 'u_amp');
    var uLineLag = gl.getUniformLocation(prog, 'u_lineLag');
    var uLineIndex = gl.getUniformLocation(prog, 'u_lineIndex');
    var uLineCount = gl.getUniformLocation(prog, 'u_lineCount');
    var uFrameX = gl.getUniformLocation(prog, 'u_frameX');
    var uFrameY = gl.getUniformLocation(prog, 'u_frameY');

    var meshes = [];
    var b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    var nodes = visiblePaintNodes(svg);
    var pathSamples = motion === 'roll' ? SAMPLES_PATH_ROLL : SAMPLES_PATH_WAVE;
    var extendFrac = art === 'wave' ? END_EXTEND_FRAC : 0;
    var DRAW_STRIP = gl.TRIANGLE_STRIP;
    var DRAW_FAN = gl.TRIANGLE_FAN;

    function pushMesh(verts, mode, color, extraBounds) {
      if (!verts || verts.length < 6) return;
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      meshes.push({
        buffer: buf,
        count: verts.length / 2,
        mode: mode,
        lineIndex: meshes.length,
        color: color
      });
      if (extraBounds) {
        expandBounds(b, extraBounds.minX, extraBounds.minY);
        expandBounds(b, extraBounds.maxX, extraBounds.maxY);
      }
    }

    if (engine === 'stamp') {
      var stamps = collectStamps(nodes);
      var si;
      for (si = 0; si < stamps.length; si++) {
        var st = stamps[si];
        var disc = discMesh(st.cx, st.cy, st.r, DISC_SEGS);
        if (!disc) continue;
        expandBounds(b, st.cx - st.r, st.cy - st.r);
        expandBounds(b, st.cx + st.r, st.cy + st.r);
        pushMesh(disc, DRAW_FAN, st.color);
      }
    } else {
      var picked = evenStride(nodes, PRIMITIVE_CAP);
      var pi;
      for (pi = 0; pi < picked.length; pi++) {
        var el = picked[pi];
        if (shouldStampElement(el, engine)) {
          var localStamps = el.tagName && el.tagName.toLowerCase() !== 'path' ? [] : stampsFromPathEl(el);
          var circ = stampFromCircleEl(el);
          if (circ) localStamps = [circ];
          var li;
          for (li = 0; li < localStamps.length; li++) {
            var ls = localStamps[li];
            var d2 = discMesh(ls.cx, ls.cy, ls.r, DISC_SEGS);
            if (!d2) continue;
            expandBounds(b, ls.cx - ls.r, ls.cy - ls.r);
            expandBounds(b, ls.cx + ls.r, ls.cy + ls.r);
            pushMesh(d2, DRAW_FAN, primitiveColor(el));
          }
          continue;
        }
        var tag = el.tagName ? el.tagName.toLowerCase() : '';
        var samples = tag === 'circle' || tag === 'ellipse' ? SAMPLES_CIRCLE : sampleCountForPath(el, pathSamples);
        var pts = tag === 'circle' || tag === 'ellipse' ? sampleCircle(el, samples) : samplePathElement(el, samples, extendFrac);
        if (!pts) continue;
        var ti;
        for (ti = 0; ti < pts.length; ti += 2) {
          expandBounds(b, pts[ti], pts[ti + 1]);
        }
        var mesh = strokeMesh(pts, halfWidthFor(el));
        if (!mesh) continue;
        pushMesh(mesh, DRAW_STRIP, primitiveColor(el));
      }
    }

    if (!meshes.length || !isFinite(b.minX)) return null;

    var artCenterX = (b.minX + b.maxX) * 0.5;
    var artCenterY = (b.minY + b.maxY) * 0.5;
    var artHalfX = Math.max((b.maxX - b.minX) * 0.5, 1);
    var artHalfY = Math.max((b.maxY - b.minY) * 0.5, 1);
    var lineCount = meshes.length;
    var start = performance.now();
    var raf = 0;
    var alive = true;
    var running = false;
    var rollSpeed = opts.rollSpeed != null ? opts.rollSpeed : 0.38;
    var speed = opts.speed != null ? opts.speed : 1.35;
    var amp = opts.amp != null ? opts.amp : 95;
    var lineLag = opts.lineLag != null ? opts.lineLag : 0.22;
    var tint = opts.tint || DEFAULT_COLOR;
    var frameX = art === 'wave' ? FRAME_X_WAVE : FRAME_X_FULL;
    var frameY = art === 'wave' ? FRAME_Y_WAVE : FRAME_Y_FULL;

    function resize() {
      var parent = canvas.parentElement || canvas;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cssW = parent.clientWidth || parent.offsetWidth || 0;
      var cssH = parent.clientHeight || parent.offsetHeight || 0;
      var w = Math.max(1, Math.floor(cssW * dpr));
      var h = Math.max(1, Math.floor(cssH * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function draw(now) {
      if (!alive) return;
      if (running) raf = requestAnimationFrame(draw);
      resize();
      var t = running ? (now - start) / 1000 : 0;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      gl.uniform2f(uArtCenter, artCenterX, artCenterY);
      gl.uniform2f(uArtHalf, artHalfX, artHalfY);
      gl.uniform1f(uTime, t);
      if (uFrameX) gl.uniform1f(uFrameX, frameX);
      if (uFrameY) gl.uniform1f(uFrameY, frameY);
      if (uRollSpeed) gl.uniform1f(uRollSpeed, rollSpeed);
      if (uSpeed) gl.uniform1f(uSpeed, speed);
      if (uAmp) gl.uniform1f(uAmp, amp);
      if (uLineLag) gl.uniform1f(uLineLag, lineLag);
      if (uLineCount) gl.uniform1f(uLineCount, lineCount);
      var mi;
      for (mi = 0; mi < meshes.length; mi++) {
        var m = meshes[mi];
        var col = m.color || tint;
        if (opts.recolor) {
          var srcA = m.color && m.color.op != null ? m.color.op : 1;
          col = [tint[0], tint[1], tint[2], (tint[3] != null ? tint[3] : 1) * srcA];
        }
        gl.uniform4f(uColor, col[0], col[1], col[2], col[3]);
        if (uLineIndex) gl.uniform1f(uLineIndex, m.lineIndex);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.buffer);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(m.mode || DRAW_STRIP, 0, m.count);
      }
    }

    function startLoop() {
      if (!alive || running) return;
      running = true;
      start = performance.now();
      raf = requestAnimationFrame(draw);
    }

    function stopLoop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      start: startLoop,
      stop: stopLoop,
      drawStill: function () {
        draw(start);
      },
      destroy: function () {
        alive = false;
        stopLoop();
      }
    };
  }

  function firstSvg(root) {
    return root.querySelector('svg');
  }

  function coverSvg(svg) {
    if (!svg) return;
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  }

  function mountFallback(fallback, svg) {
    if (!fallback || !svg) return;
    fallback.innerHTML = '';
    var clone = svg.cloneNode(true);
    coverSvg(clone);
    fallback.appendChild(clone);
  }

  function showStatic(stage, canvas, fallback) {
    if (canvas) canvas.classList.add('is-idle');
    if (fallback) fallback.classList.remove('is-hidden');
    if (stage) {
      stage.classList.add('is-oa-static');
      stage.classList.remove('is-oa-live');
      stage.classList.remove('is-oa-editor');
    }
  }

  function showEditor(stage, canvas, fallback, svg) {
    coverSvg(svg);
    if (canvas) canvas.classList.add('is-idle');
    if (fallback) fallback.classList.add('is-hidden');
    if (stage) {
      stage.classList.add('is-oa-editor');
      stage.classList.remove('is-oa-live');
      stage.classList.remove('is-oa-static');
    }
  }

  function showLive(stage, canvas, fallback) {
    if (canvas) canvas.classList.remove('is-idle');
    if (fallback) fallback.classList.add('is-hidden');
    if (stage) {
      stage.classList.add('is-oa-live');
      stage.classList.remove('is-oa-static');
      stage.classList.remove('is-oa-editor');
    }
  }

  function loadSvg(source, done) {
    done(firstSvg(source) || null);
  }

  function initStage(stage) {
    if (!stage || stage.getAttribute('data-sw-cards-oa-ready')) return;
    stage.setAttribute('data-sw-cards-oa-ready', '1');
    var source = stage.querySelector('.sw-cards__outer-animated-source');
    var canvas = stage.querySelector('.sw-cards__outer-animated-canvas');
    var fallback = stage.querySelector('.sw-cards__outer-animated-fallback');
    if (!source) return;

    loadSvg(source, function (svg) {
      if (!svg) {
        showStatic(stage, canvas, fallback);
        return;
      }
      window.requestAnimationFrame(function () {
        coverSvg(svg);
        if (window.hsInEditor) {
          showEditor(stage, canvas, fallback, svg);
          return;
        }
        if (isStaticEnv() || !canvas) {
          mountFallback(fallback, svg);
          showStatic(stage, canvas, fallback);
          return;
        }

      var ctrl = null;
      var io = null;

      function bootGl() {
        if (ctrl || isStaticEnv()) return;
        ctrl = startEngine(canvas, svg, {
          art: stage.getAttribute('data-art') || 'wave',
          motion: stage.getAttribute('data-motion') || 'wave',
          rollSpeed: Number(stage.getAttribute('data-roll-speed')),
          speed: Number(stage.getAttribute('data-wave-speed')),
          amp: Number(stage.getAttribute('data-wave-amp')),
          lineLag: Number(stage.getAttribute('data-wave-lag')),
          recolor: stage.getAttribute('data-recolor') === '1',
          tint: stageColor(stage)
        });
        if (!ctrl) {
          mountFallback(fallback, svg);
          showStatic(stage, canvas, fallback);
          return;
        }
        ctrl.drawStill();
        window.requestAnimationFrame(function () {
          showLive(stage, canvas, fallback);
          ctrl.start();
        });
      }

      function teardownGl() {
        if (ctrl) {
          ctrl.destroy();
          ctrl = null;
        }
        mountFallback(fallback, svg);
        showStatic(stage, canvas, fallback);
      }

      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(
          function (entries) {
            var e = entries[0];
            if (e && e.isIntersecting) {
              if (!ctrl) bootGl();
              else ctrl.start();
            } else if (ctrl) {
              ctrl.stop();
            }
          },
          { threshold: 0.05, rootMargin: '80px 0px' }
        );
        io.observe(stage);
      } else {
        bootGl();
      }

      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        var onMotion = function () {
          if (prefersReducedMotion()) teardownGl();
          else bootGl();
        };
        if (mq.addEventListener) mq.addEventListener('change', onMotion);
        else if (mq.addListener) mq.addListener(onMotion);
      }
      });
    });
  }

  function bootAnimated() {
    var stages = document.querySelectorAll('[data-sw-cards-outer-animated]');
    var i;
    for (i = 0; i < stages.length; i++) {
      initStage(stages[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAnimated);
  } else {
    bootAnimated();
  }
})();
