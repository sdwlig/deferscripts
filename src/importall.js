/**
   @license Copyright (c) 2016-2020 Yebo, Inc. Stephen D. Williams
   Apache 2.0 licensed
   @prettier
*/
/* eslint camelcase:0, maxcomplexity:0, unused:0, comma-dangle:0, ecmaVersion:6 */
/* eslint-disable import/no-extraneous-dependencies, comma-dangle, no-console, no-continue */
/* global iall */

// Used where '/app/path/' + 'relative/path/file.png' can be replaced by
// /assets/file_123456.png after cache management build.
window.cachePath = window.condPath = function condPath(path, fpath) {
  if (fpath[0] === '/') return fpath;
  if (fpath.startsWith(path.slice(1))) return `/${fpath}`;
  return path + fpath;
};

// Only expect these arguments: fn, done or fn, done, delay.
// If fn() returns 'quiet', keeps waiting but no or less logging.
const whenReadyFn = (window.whenReadyFn = function whenReadyFn(fnp, donep, delayp, tier) {
  var startp, lastReportp, quietp;
  // if (startp) console.error(`startp present: ${startp}`);
  // if (lastReportp) console.error(`lastReportp present: ${lastReportp}`);
  // if (quietp) console.error(`quietp present: ${quietp}`);
  var now = Date.now();
  var ctxx = {
    // ob: this,
    whenReadyFnLoop: whenReadyFnLoop || (this && this.whenReadyFnLoop) || (window && window.whenReadyFnLoop),
    now,
    start: startp || now,
    lastReport: lastReportp || now,
    delay: delayp || 10,
    quiet: quietp || false,
    warn: (ctx, fn) => {
      ctx.now = Date.now();
      if (!ctx.quiet && ctx.now - ctx.start > 3000 && ctx.now - ctx.lastReport > 3000) {
        ctx.lastReport = ctx.now;
        console.warn(
          `%cwhenReadyFn still waiting: ${((ctx.now - ctx.start) / 1000) | 0} seconds for:${fn}`,
          'color:orange',
        );
      }
    },
    next: (ctx, fn, done) => {
      var fin;
      if (!tier) fin = fn(); // Allow setting breakpoints for only certain functions.
      if (tier === 1) fin = fn();
      if (tier === 2) fin = fn();

      if (fin === Object(fin) && (fin.deferDelay || fin.deferQuiet)) {
        ctx.delay = fin.deferDelay ? fin.deferDelay : ctx.delay;
        fin = fin.deferQuiet;
      }
      const quiet = fin === 'quiet';
      if (quiet) fin = false;
      if (!fin && !quiet) ctx.warn(ctx, fn);
      if (fin) {
        let ret;
        try {
          ret = done();
        } catch (err) {
          console.error(err);
        }
        return ret;
      }
      return setTimeout(() => {
        // if (!ctx.ob || !ctx.ob.whenReadyFnLoop) debugger;
        ctx.whenReadyFnLoop(fn, done, ctx);
      }, ctx.delay);
    },
  };
  ctxx.next(ctxx, fnp, donep);
});

var whenReadyFnLoop = (window.whenReadyFnLoop = function whenReadyFnLoop(fn, done, ctx) {
  ctx.next(ctx, fn, done);
});

var deferInterval = (window.deferInterval = function deferInterval(owner, task, rate, len, dir) {
  rate = rate || 100;
  len = len || Infinity;
  owner = owner || this;
  var ctx = {owner, task, rate, len, dir: dir || 1, index: dir < 0 ? len : 0};
  if (Number.isFinite(rate) && rate > 0) ctx.rate = Math.floor(rate);
  if (len > 0) ctx.len = Math.floor(len);
  const tst = () => {
    ctx.task.call(ctx.owner, ctx.index, ctx.len, ctx.dir);
    ctx.index += ctx.dir;
    const more = ctx.index < ctx.len && ctx.index > 0;
    return !more;
  };
  const final = () => {};
  whenReadyFn(tst, final, rate);
});
var deferTest = (idx, len, dir) => {
  console.log(`idx:${idx} len:${idx} dir:${dir}`);
};
// deferInterval(this, deferTest, 10, 100);
// deferInterval(this, deferTest, 10, 100, -2);

/**
 * deferScripts supports async loading of scripts.
 * Async with dependency handling.
 * If iscripts is a string, it is loaded directly.  An array iterated.
 * If array item is an array, [0] is function to wait for, [1] is file to load.
 * If file path starts with 'module:', then type="module" is set.
 * For s=iscripts[n], if s is array, whenReadyFn(s[0], asyncload(s[1]))
 * @arg iscripts Array of script path strings or subarray of test function, path.
 * Based on: https://www.html5rocks.com/en/tutorials/speed/script-loading/
 */
window.iall = {};
window.iall.loaded = {}; // To keep track of what has been loaded.
window.iall.deferLoading = {}; // To keep track of what is loading, preventing redundancy.
// window.deferRound = 0;
window.importLoading = function importLoading() {
  return window.ial.deferLoading;
};
window.importLoading = function importLoading() {
  return window.ial.deferLoading.length === 0;
};
window.importAllWait = function importAllWait(fn) {
  whenReadyFn(() => window.importLoadingDone(), fn && fn());
};

// This is not as readable as it should be because it started as hand-minified
// and now has many features.
window.importAll = window.deferScripts = function deferScripts(iscripts, onLoadFn) {
  whenReadyFn(
    () => document.body,
    () => {
      !(function(doc, t, iscriptsin) {
        // window.deferRound += 5;
        const ial = {}; // (window.ial = {});
        ial.loaded = window.iall.loaded; // To keep track of what has been loaded.
        ial.deferLoading = {}; // To keep track of what is loading, preventing redundancy.
        ial.count = 0;
        ial.debug = iall.debug;
        ial.max = iall.debugslow ? {html: 1, css: 1, js: 1, json: 1} : {html: 1000, css: 100, js: 1000, json: 4};
        ial.track = {html: 0, css: 0, js: 0, json: 0};
        ial.q = {html: [], css: [], js: [], json: []};
        ial.headPending = [];
        ial.bodyPending = [];
        function n() {
          for (; d[0] && d[0][f] === 'loaded'; ) (c = d.shift()), (c[o] = !i.parentNode.insertBefore(c, i));
        }
        let fns = {};
        const logQs = (op, path) => {
          console.warn(
            `Total: ${ial.count} In process:`,
            JSON.stringify(ial.track, null, 0),
            ` Queued: HTML:${ial.q.html.length} CSS:${ial.q.css.length} JS:${ial.q.js.length} ${op || ''} ${path ||
              ''}`,
          );
        };
        // const emptyqueue = type => ial.q[type].length === 0;
        const emptyqueues = (window.iall.emptyqueues = fn => {
          whenReadyFn(() => Object.keys(ial.deferLoading).length === 0, fn);
        });
        const enqueue = (path, type, mod) => {
          if (ial.track[type] >= ial.max[type]) {
            console.warn(`Enqueing ${path}`);
            ial.q[type].push({path, type, mod});
            return true;
          }
          ial.track[type]++;
          ial.debug && logQs('start:', path);
          return false;
        };
        const dequeueImpl = (dpath, dtype) => {
          ial.track[dtype]--;
          ial.debug && logQs('done:', dpath);
          if (ial.track[dtype] < ial.max[dtype] && ial.q[dtype].length) {
            const {path, type, mod} = ial.q[dtype].shift();
            if (path) {
              console.warn(`Dequeing to process ${path}`);
              fns[type](path, mod);
            }
          }
        };
        const dequeue = (dpath, dtype) => {
          if (iall.debugslow) setTimeout(() => dequeueImpl(dpath, dtype), 1000);
          else dequeueImpl(dpath, dtype);
        };
        const loaded = path => {
          ial.loaded[path] = true;
          window.iall.loaded[path] = true;
          delete ial.deferLoading[path];
          delete window.iall.deferLoading[path];
        };
        const getsd = () => {
          let sd = document.body.querySelector('#deferscriptdiv');
          if (!sd) {
            sd = document.createElement('div');
            sd.id = 'deferscriptdiv';
            sd.style.display = 'none';
            try {
              document.body.appendChild(sd);
            } catch (err) {
              console.warn(`Ignoring error in script ${s}:`, err);
            }
          }
          return sd;
        };
        const getcd = () => {
          let cd = document.body.querySelector('#defercomponentdiv');
          if (!cd) {
            cd = document.createElement('div');
            cd.id = 'defercomponentdiv';
            cd.style.display = 'none';
            document.body.appendChild(cd);
          }
          return cd;
        };
        this.hfnref = null;
        const hfn = (path, retries) => {
          if (enqueue(path, 'html')) return;
          fetch(path)
            .then(response => response.text())
            .then(data => {
              try {
                const cd = getcd();
                cd.insertAdjacentHTML('beforeend', data);
                if (ial.debug) console.warn(`Loaded: ${path}`);
                loaded(path);
                dequeue(path, 'html');
              } catch (err) {
                console.error(err);
              }
            })
            .catch(err => {
              console.error(err);
              retries = retries || 0;
              if (retries < 4) {
                setTimeout(() => this.hfnref(path, ++retries), 50);
              }
            });
        };
        this.hfnref = hfn;
        this.cssfnref = null;
        const cssfn = (path, retries) => {
          if (enqueue(path, 'css')) return;
          var el = document.createElement('link');
          el.rel = 'stylesheet';
          el.type = 'text/css';
          el.href = path;
          el.onerror = err => {
            console.error(`importAll:`, err);
            retries = retries || 0;
            if (retries < 4) {
              setTimeout(() => this.cssfnref(path, ++retries), 50);
            }
          };
          el.onload = () => {
            if (ial.debug) console.warn(`Loaded: ${path}`);
            loaded(path);
            dequeue(path, 'css');
          };
          document.head.appendChild(el);
        };
        this.cssfnref = cssfn;
        let fn = () => {};
        const wfn = path => {
          let mod = false;
          let css = false;
          let asyncc = false;
          let trying = true;
          while (trying) {
            trying = false;
            try {
              if (path.startsWith('module:')) {
                mod = trying = true;
                path = path.slice(7);
              }
              if (path.startsWith('css:')) {
                css = trying = true;
                path = path.slice(4);
              }
              if (path.startsWith('async:')) {
                asyncc = trying = true;
                path = path.slice(6);
              }
            } catch (err) {
              console.error(err);
              debugger;
            }
          }
          return {cfn: path.endsWith('.html') ? hfn : css || path.endsWith('.css') ? cssfn : fn, path, mod, asyncc};
        };
        for (
          var ss, a, c, d = [], i = doc.scripts[0], o = 'onreadystatechange', f = 'readyState';
          (ss = iscriptsin.shift());

        ) {
          // Cache & prevent redundant loads.
          const ssp = Array.isArray(ss) ? ss[1] : ss;
          const last = iscriptsin.length === 0;
          // console.log(`round:${ial.deferRound} loadedCount:${ial.loadedCount}`);
          this.fnref = null;
          fn = (src, fmod, asyncc, retries) => {
            if (enqueue(src, 'js', fmod)) return;
            a = document.createElement(t);
            if (fmod) a.setAttribute('type', 'module');
            // if (asyncc) a.setAttribute('async', true);
            // a.setAttribute('defer', true);
            const sd = getsd();
            a.onload = () => {
              if (ial.debug) console.warn(`Loaded: ${src}${fmod ? `, a module` : ''}`);
              loaded(src);
              dequeue(src, 'js');
              // if (emptyqueues() && onLoadFn) onLoadFn();
            };
            a.onerror = err => {
              console.error(`importAll:`, err);
              retries = retries || 0;
              if (retries < 4) {
                setTimeout(() => this.fnref(src, fmod, asyncc, ++retries), 50);
              }
            };
            try {
              a.src = src;
              sd.appendChild(a);
            } catch (err) {
              console.warn(`Ignoring error in script ${src}:`, err);
            }
            // iscriptsin[0] ? iscriptsin : (a.onload = onLoadFn);
          };
          this.fnref = fn;
          fns = {html: hfn, css: cssfn, js: fn, json: fn};
          let apath = ss;
          let check;
          if (Array.isArray(ss)) {
            check = ss[0];
            apath = ss[1];
          }
          const {cfn, path, mod, asyncc} = wfn(apath);
          if (/three...three.*[.]js/.exec(path) && ial.debug) {
            console.warn(`debugging three.js load: ${path}`);
          }
          if (ial.debug) console.warn(`${ial.count} defer${mod ? ' module' : ''} loading: ${ssp}`);
          if (window.iall.deferLoading[path] || window.iall.loaded[path]) continue;
          ial.deferLoading[path] = window.iall.deferLoading[path] = true;
          ial.count++;
          const loadfn = () => cfn(path, mod, asyncc);
          if (check) whenReadyFn(check, loadfn);
          else loadfn();
        }
        if (onLoadFn) {
          const end = getsd();
          const el = document.createElement(t);
          el.defer = true;
          el.onload = () => {
            if (ial.debug) console.warn(`Calling onLoadFn:${onLoadFn}`);
            onLoadFn();
          };
          let smsg = '';
          if (ial.debug) smsg = `\`${onLoadFn.toString()}\`;\n`;
          el.innerHTML = `${smsg}iall.emptyqueues(document.currentScript.onload);`;
          end.appendChild(el);
        }
      })(document, 'script', iscripts);
    },
  );
};
