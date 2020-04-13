/**
   @license Copyright (c) 2016-2020 Yebo, Inc.
   @prettier
*/
/* eslint camelcase:0, maxcomplexity:0, unused:0, comma-dangle:0, ecmaVersion:6 */
/* eslint-disable import/no-extraneous-dependencies, comma-dangle, no-console */
/* eslint-disable import/no-unresolved, import/no-absolute-path, import/extensions */
/* exported fixedEncodeURIComponent fixedDecodeURIComponent isNumber fixNumber matches */
/* exported _computedClass _mkArray _mkObArray notEmpty qs f2 dataToFile */
/* global moment, diff_match_patch, numeric, _, whenReadyFn */
/* exported asUtility */

// Meant to be used as a mixin, as per:
// https://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/
export class Utility {
  // window.asUtility = function asu(/* options */) {
  // http://stackoverflow.com/questions/8572826/generic-deep-diff-between-two-objects
  // http://jsfiddle.net/drzaus/9g5qoxwj/44/
  // sdw: rewritten
  constructor() {
    this.resInit();
    this.type2cMap = {
      ach: 'a',
      ad: 'A',
      app: 'app',
      appsession: 'as',
      authoredit: 'e',
      career: 'J',
      channel: 'chan',
      concept: 'C',
      course: 'c',
      file: 'f',
      gallery: 'y',
      game: 'G',
      gamechassis: 'g',
      grp: 'R',
      html: 'h',
      image: 'i',
      impression: 'I',
      job: 'j',
      lms: 'l',
      media: 'm',
      meetup: 'M',
      model: 'model',
      module: 'mod',
      path: 'p',
      pdf: 'pdf',
      play: 'P',
      price: '$',
      purchase: '$$',
      quiz: 'q',
      read: 'r',
      room: 'room',
      stats: 's',
      text: 't',
      unit: 'u',
      usr: 'U',
      video: 'v',
      watch: 'w',
    };
    this.c2typeMap = {
      p: 'path',
      c: 'course',
      u: 'unit',
      C: 'concept',
      q: 'quiz',
      r: 'read',
      room: 'room',
      w: 'watch',
      P: 'play',
      e: 'authoredit',
      U: 'usr',
      R: 'grp',
      y: 'gallery',
      g: 'gamechassis',
      G: 'game',
      a: 'ach',
      $: 'price',
      $$: 'purchase',
      A: 'ad',
      I: 'impression',
      j: 'job',
      J: 'career',
      l: 'lms',
      s: 'stats',
      chan: 'channel',
      app: 'app',
      as: 'appsession',
      m: 'media',
      M: 'meetup',
      model: 'model',
      mod: 'module',
      file: 'f',
      pdf: 'pdf',
      t: 'text',
      h: 'html',
      i: 'image',
      v: 'video',
    };
  }
  deepDiff(a, b, r) {
    // Object.entries(a).forEach(([key, value]) => {    });
    _.each(a, (v, k) => {
      // already checked this or equal...
      if (Object.prototype.hasOwnProperty.call(r, k) || b[k] === v) {
        return;
      }
      // but what if it returns an empty object? still attach?
      r[k] = _.isObject(v) ? _.difference(v, b[k]) : v;
    });
  }

  shallowDiff(a, b) {
    return _.omit(a, (v, k) => b[k] === v);
  }

  diff(a, b) {
    var r = {};
    a = a || {};
    b = b || {};
    this.deepDiff(a, b, r);
    this.deepDiff(b, a, r);
    return r;
  }

  f2(f) {
    return Number.parseFloat(f).toFixed(2);
  }

  dataToFile(data) {
    var png = data.split(',')[1];
    var byteCharacters = atob(png);
    var byteNumbers = new Array(byteCharacters.length);
    for (var i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    var byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], 'capture.png', {
      type: 'image/png',
      lastModified: Date.now(),
    });
  }

  fixedEncodeURIComponent(str) {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16)}`)
      .replace(/%20/g, '+');
  }

  fixedDecodeURIComponent(str) {
    return decodeURIComponent(str.replace(/[+]/g, '%20'));
  }

  fixStr(n, m) {
    if (n === undefined || n.length < 1) {
      if (typeof m === 'string') {
        return m;
      }
      return m();
    }
    return n;
  }

  fixStrFn(img, fn) {
    if (img === undefined || img.length < 1) {
      return fn();
    }
    return img;
  }

  optional(cb) {
    try {
      return cb();
    } catch (e) {
      if (e instanceof TypeError) return null;
      throw e;
    }
  }

  urlencode(str) {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16)}`)
      .replace(/%20/g, '+');
  }

  urldecode(str) {
    return decodeURIComponent(str.replace(/[+]/g, '%20'));
  }

  // Encode % as %25
  parenc(str) {
    return str.replace(/%/g, '%25');
  }

  matches(s, t) {
    if (!s) return false;
    var ret = t.split(',').reduce((r, k) => r || s === k, false);
    return ret;
  }

  _computedClass(selected, cls) {
    return selected ? cls : '';
  }

  _mkArray(n) {
    var a;
    for (a = []; n--; a[n] = n + 1);
    return a;
  }

  _mkObArray(n) {
    var a = [];
    for (; n--; a[n] = {index: n + 1});
    return a;
  }

  notEmpty(item, fields) {
    var bad = fields.filter(f => !(item[f] && item[f].length > 0));
    return bad;
  }

  _parseCookie(name) {
    try {
      var pairs = document.cookie.split(/\s*;\s*/);
      var map = pairs.map(kv => {
        var eq = kv.indexOf('=');
        return {
          name: unescape(kv.slice(0, eq)),
          value: unescape(kv.slice(eq + 1)),
        };
      });
      var nom = name;
      return map.filter(kv => kv.name === nom)[0];
    } catch (err) {
      console.error(err);
    }
    return null;
  }

  randomString(length) {
    var bytes = new Uint8Array(length);
    var random = window.crypto.getRandomValues(bytes);
    var result = [];
    var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
    random.forEach(c => {
      result.push(charset[c % charset.length]);
    });
    return result.join('');
  }

  logStringDiff(s1, s2) {
    if (!s2) debugger;
    if (!s1) {
      console.log('All new:', s2);
      return;
    }
    var dmp = new diff_match_patch();
    var diff = dmp.diff_main(s1, s2);
    dmp.diff_cleanupSemantic(diff);
    // Result: [(-1, "Hello"), (1, "Goodbye"), (0, " World.")]
    console.log(diff);
    // diff.forEach(d => {    });
  }

  // https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
  async fetch_retry(url, options, n) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (n === 1) throw err;
      return await fetch_retry(url, options, n - 1);
    }
  }

  // Polymer helper
  fireb(type, detail) {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  get(obj, key, def) {
    var ret = key.split('.').reduce((o, x) => (typeof o === 'undefined' || o === null ? def : o[x]), obj);
    return ret || def;
  }

  has(obj, key) {
    return key.split('.').every(x => {
      if (typeof obj !== 'object' || obj === null || !(x in obj)) return false;
      obj = obj[x];
      return true;
    });
  }

  queryEvent(type) {
    return new Promise((resolve, reject) => {
      this.dispatchEvent(
        new CustomEvent(type, {
          detail: result => resolve(result),
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  error(response) {
    console.error(response);
    return response;
  }

  isNumber(n) {
    return !Number.isNaN(parseFloat(n)) && Number.isFinite(n);
  }

  fixNumber(n, m) {
    return !this.isNumber(n) ? m : n;
  }

  timestampNow() {
    return moment.utc().format('YYYYMMDDTHHmmss.SSS');
  }

  genId() {
    return moment.utc().format('mmss');
  }

  Exception(msg, data) {
    this.message = msg;
    this.data = data;
    return this;
  }

  type2c(type) {
    let c = '';
    try {
      c = this.type2cMap[type];
    } catch (e) {}
    return c;
  }

  c2type(type) {
    let c = '';
    try {
      c = this.c2typeMap[type];
    } catch (e) {}
    return c;
  }

  mkcid(item, keepgoing) {
    let id = '/e404/';
    var enc = this.urlencode;
    try {
      id = `/${enc(this.type2c(item.cmp_type))}/`;
    } catch (e) {
      console.log(`dao.mkcid failed:${e.toString()}`);
      return null;
    }
    id = `${id + enc(item.cmp_group)}/${enc(item.cmp_author)}/${enc(item.cmp_id)}/${enc(
      item.cmp_branch,
    )}/${item.cmp_ts}`;
    if (!keepgoing) {
      var check = /\/\//.test(id);
      if (check && check.length > 0) {
        return null;
      }
    }
    return id;
  }

  updateId(item) {
    if (item) {
      try {
        item.cmp_cid = this.mkcid(item);
      } catch (err) {
        console.error(err, ' while trying to updateItem');
      }
    }
  }

  urlencode(str) {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16)}`)
      .replace(/%20/g, '+');
  }

  splitpath(path) {
    if (!path || path.length < 1) return {};
    var dec = this.urldecode;
    let idd;
    try {
      const idp = path.split('/', 8);
      const il = idp.length;
      idd = {
        cmp_type: dec(this.c2type(idp[1])),
        cmp_group: il > 2 ? dec(idp[2]) : null,
        cmp_author: il > 3 ? dec(idp[3]) : null,
        cmp_id: il > 4 ? dec(idp[4]) : null,
        cmp_branch: il > 5 ? dec(idp[5]) : null,
        cmp_ts: il > 6 ? idp[6] : null,
        cmp_misc: il > 7 ? dec(idp[7]) : null,
      };
    } catch (e) {
      if (this.debug) {
        console.error(e);
      }
      throw new this.Exception('Invalid ID.', path);
    }
    return idd;
  }

  requiredParam(param) {
    const requiredParamError = new Error(`Required parameter, "${param}" is missing.`);
    // preserve original stack trace
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(requiredParamError, requiredParam);
    }
    throw requiredParamError;
  }

  pipe(...fns) {
    return param => fns.reduce((result, fn) => fn(result), param);
  }

  // Determines if the passed element is overflowing its bounds,
  // either vertically or horizontally.
  // Will temporarily modify the "overflow" style to detect this
  // if necessary.
  checkOverflow(el) {
    var curOverflow = el.style.overflow;
    if (!curOverflow || curOverflow === 'visible') el.style.overflow = 'hidden';
    var isOverflowing = el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight;
    el.style.overflow = curOverflow;
    return isOverflowing;
  }

  safeJParse(val) {
    var ret = '';
    try {
      ret = JSON.parse(val);
      if (Array.isArray(ret)) ret = ret[0];
    } catch (err) {
      console.warn(err);
      console.warn(val);
    }
    return ret;
  }

  ie() {
    return Math.sqrt(screen.deviceXDPI * screen.deviceYDPI) / one.dpi;
  }

  dppx() {
    // devicePixelRatio: Webkit (Chrome/Android/Safari), Opera (Presto 2.8+), FF 18+
    return typeof window === 'undefined' ? 0 : +window.devicePixelRatio || this.ie() || 0;
  }

  dpcm() {
    return dppx() * this.one.dpcm;
  }

  dpi() {
    return dppx() * this.one.dpi;
  }

  resInit() {
    this.one = {dpi: 96, dpcm: 96 / 2.54};
    this.res = {dppx: this.dppx, dpi: this.dpi, dpcm: this.dpcm};
  }
}
