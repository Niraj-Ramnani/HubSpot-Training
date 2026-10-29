// ===============================
// Smithworks' SW Hero module.js
// SW Category: Banners
// Master version number: 2026.09.16.10.37
// Changelog: ../CHANGELOG.md
// ===============================

(function() {
  'use strict';

  function runEmbedLogic() {
    var oembedContainers = document.querySelectorAll('.sw-hero--has-bg-video .oembed_container');
    var embedContainers = document.querySelectorAll('.sw-hero--has-bg-video .embed_container');

    function loadOEmbed(container) {
      var iframeWrapper = container.querySelector('.iframe_wrapper');
      if (!iframeWrapper) return;
      var url = (iframeWrapper.dataset && iframeWrapper.dataset.embedUrl) || iframeWrapper.getAttribute('data-embed-url');
      if (!url) return;

      var request = new XMLHttpRequest();
      var requestUrl = '/_hcms/oembed?url=' + encodeURIComponent(url) + '&autoplay=1';
      request.open('GET', requestUrl, true);
      request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
          try {
            var data = JSON.parse(request.responseText);
            if (!data || !data.html) return;
            var el = document.createElement('div');
            el.innerHTML = data.html;
            var iframe = el.firstChild;
            if (!iframe || iframe.tagName !== 'IFRAME') return;
            if (iframeWrapper.querySelector('iframe')) return;
            iframe.setAttribute('class', 'oembed_container_iframe');
            if (data.title) iframe.setAttribute('title', data.title);
            var src = iframe.getAttribute('src') || '';
            try {
              if (src.indexOf('youtube.com') !== -1 || src.indexOf('youtu.be') !== -1) {
                var sep = src.indexOf('?') !== -1 ? '&' : '?';
                if (src.indexOf('autoplay') === -1) { src += sep + 'autoplay=1'; sep = '&'; }
                if (src.indexOf('mute') === -1) { src += sep + 'mute=1'; }
                iframe.setAttribute('src', src);
              } else if (src.indexOf('vimeo.com') !== -1) {
                sep = src.indexOf('?') !== -1 ? '&' : '?';
                if (src.indexOf('autoplay') === -1) { src += sep + 'autoplay=1'; sep = '&'; }
                if (src.indexOf('muted') === -1) { src += sep + 'muted=1'; }
                iframe.setAttribute('src', src);
              }
            } catch (e) {}
            iframeWrapper.appendChild(iframe);
          } catch (e) {
            console.error('SW Hero oEmbed: parse error', e);
          }
        }
      };
      request.onerror = function() {};
      request.send();
    }

    function loadEmbed(container) {
      var iframe = container.querySelector('.iframe_wrapper iframe');
      if (iframe) {
        iframe.style.height = '100%';
        iframe.style.width = '100%';
      }
    }

    for (var i = 0; i < oembedContainers.length; i++) {
      loadOEmbed(oembedContainers[i]);
    }
    for (var j = 0; j < embedContainers.length; j++) {
      loadEmbed(embedContainers[j]);
    }
  }

  function auroraRand(min, max) {
    return min + Math.random() * (max - min);
  }

  /* Per-load path jitter: independent X/Y already wander; this varies distance + phase. */
  function jitterOuterAuroraWash(wash) {
    if (!wash) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    var specs = [
      { dx: [14, 28], dy: [8, 22], ds: [1.08, 1.22] },
      { dx: [-48, -28], dy: [12, 28], ds: [1.1, 1.24] },
      { dx: [10, 26], dy: [-28, -12], ds: [1.1, 1.28] }
    ];
    var blobs = wash.querySelectorAll('.sw-hero__outer-aurora-blob');
    var i;
    for (i = 0; i < blobs.length; i++) {
      var spec = specs[i] || specs[0];
      var blob = blobs[i];
      blob.style.setProperty('--sw-oa-dx', auroraRand(spec.dx[0], spec.dx[1]).toFixed(1) + '%');
      blob.style.setProperty('--sw-oa-dy', auroraRand(spec.dy[0], spec.dy[1]).toFixed(1) + '%');
      blob.style.setProperty('--sw-oa-ds', auroraRand(spec.ds[0], spec.ds[1]).toFixed(2));
      blob.style.animationDelay = (-auroraRand(0, 18)).toFixed(2) + 's';
      var stamp = blob.querySelector('.sw-hero__outer-aurora-stamp');
      if (stamp) {
        stamp.style.animationDelay = (-auroraRand(0, 22)).toFixed(2) + 's';
      }
    }
  }

  function initOuterAuroraMotion() {
    var washes = document.querySelectorAll('.sw-hero__outer-aurora.is-aurora-motion, .sw-hero__inner-aurora.is-aurora-motion');
    var w;
    for (w = 0; w < washes.length; w++) {
      jitterOuterAuroraWash(washes[w]);
    }
  }

  function boot() {
    runEmbedLogic();
    initOuterAuroraMotion();
    initSvgOverlays();
  }

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
    var root = shapes.length ? shapes[0].closest('[data-sw-hero-svg-overlay]') : null;
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
    var src = root.querySelector('.sw-hero__svg-overlay-src');
    var graphic = root.querySelector('.sw-hero__svg-overlay-graphic');
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
    var nodes = document.querySelectorAll('[data-sw-hero-svg-overlay]');
    var n;
    for (n = 0; n < nodes.length; n++) {
      try {
        svoMount(nodes[n]);
      } catch (err) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
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
    if (!stage || stage.getAttribute('data-sw-hero-oa-ready')) return;
    stage.setAttribute('data-sw-hero-oa-ready', '1');
    var source = stage.querySelector('.sw-hero__outer-animated-source');
    var canvas = stage.querySelector('.sw-hero__outer-animated-canvas');
    var fallback = stage.querySelector('.sw-hero__outer-animated-fallback');
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
    var stages = document.querySelectorAll('[data-sw-hero-outer-animated]');
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
