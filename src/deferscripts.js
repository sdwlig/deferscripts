/**
   @license Copyright (c) 2016-2020 Yebo, Inc. Stephen D. Williams
   @prettier
*/
/* eslint camelcase:0, maxcomplexity:0, unused:0, comma-dangle:0, ecmaVersion:6 */
/* eslint-disable import/no-extraneous-dependencies, comma-dangle, no-console, no-continue */

// Used where '/app/path/' + 'relative/path/file.png' can be replaced by
// /assets/file_123456.png after cache management build.
window.cachePath = window.condPath = function condPath(path, fpath) {
  if (fpath[0] === '/') return fpath;
  if (fpath.startsWith(path.slice(1))) return `/${fpath}`;
  return path + fpath;
};

// Only expect these arguments: fn, done or fn, done, delay.
// If fn() returns 'quiet', keeps waiting but no or less logging.
var whenReadyFn = (window.whenReadyFn = function whenReadyFn(fnp, donep, delayp, startp, lastReportp, quietp) {
  // if (!this) debugger;
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
          'color:orange'
        );
      }
    },
    next: (ctx, fn, done) => {
      var fin = fn();
      if (fin === Object(fin) && (fin.deferDelay || fin.deferQuiet)) {
        ctx.delay = fin.deferDelay ? fin.deferDelay : ctx.delay;
        fin = fin.deferQuiet;
      }
      if (!fin || (fin && fin !== 'quiet')) ctx.warn(ctx, fn);
      if (fin && fin !== 'quiet') {
        let ret;
        try {
          ret = done();
        } catch (err) { console.error(err); }
        return ret;
      }
      return setTimeout(() => {
        // if (!ctx.ob || !ctx.ob.whenReadyFnLoop) debugger;
        ctx.whenReadyFnLoop(fn, done, ctx);
      }, ctx.delay);
    }
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
window.ial = new Object();
ial.deferLoaded = {}; // To keep track of what has been loaded.
ial.deferLoading = {}; // To keep track of what is loading, preventing redundancy.
ial.count = 0;
ial.debug = true;
ial.max = {'html':1000, 'css':100, 'js':1000, 'json':4};
ial.track = {'html':0, 'css':0, 'js':0, 'json':0};
ial.q = {'html':[], 'css':[], 'js':[], 'json':[]};
ial.headPending = [];
ial.bodyPending = [];
// window.deferRound = 0;
var importLoading = (window.importLoading = function importLoading() {
  return ial.deferLoading;
});
var importLoadingDone = (window.importLoading = function importLoading() {
  return ial.deferLoading.length === 0;
});
var importAllWait = (window.importAllWait = function importAllWait(fn) {
  whenReadyFn(() => importLoadingDone(), fn && fn());
});

// This is not as readable as it should be because it started as hand-minified
// and now has many features.
var importAll = deferScripts = (window.importAll = window.deferScripts = function deferScripts(iscripts, onLoadFn) {
  !(function(e, t, iscriptsin) {
    // window.deferRound += 5;
    function n() {
      for (; d[0] && d[0][f] === 'loaded'; ) (c = d.shift()), (c[o] = !i.parentNode.insertBefore(c, i));
    }
    let fns = {};
    let logQs = () => {
      console.warn(`Total: ${ial.count} In process:`, JSON.stringify(ial.track, null, 0), ` Queued: HTML:${ial.q['html'].length} CSS:${ial.q['css'].length} JS:${ial.q['js'].length}`);
    };
    let enqueue = (path, type, mod) => {
      if (ial.track[type] >= ial.max[type]) {
        console.warn(`Enqueing ${path}`);
        ial.q[type].push({path, type, mod});
        return true;
      }
      ial.track[type]++;
      ial.debug && logQs();
      return false;
    };
    let dequeue = (dpath, dtype) => {
      ial.track[dtype]--;
      ial.debug && logQs();
      if (ial.track[dtype] < ial.max[dtype] && ial.q[dtype].length) {
        let {path, type, mod} = ial.q[dtype].shift();
        if (path) {
          console.warn(`Dequeing ${path}`);
          fns[type](path, mod);
        }
      }
    };
    let hfn = path => {
      if (enqueue(path, 'html')) return;
      let lssp = path;
      fetch(path).then(function (response) {
	      return response.text();
      }).then(function (data) {
        let cd = document.body.querySelector('#defercomponentdiv');
        if (!cd) {
          cd = document.createElement('div');
          cd.id = 'defercomponentdiv';
          cd.style.display = 'none';
          document.body.appendChild(cd);
        }
        cd.insertAdjacentHTML('beforeend', data);
        ial.debug && console.warn(`Loaded: ${path}`);
        ial.deferLoading[lssp] = false;
        ial.deferLoaded[lssp] = true;
        dequeue(lssp, 'html');
      }).catch(function (err) {
	      console.error(err);
      });
    };
    let hfnbroken = path => {
      return; // Doesn't really work as object is a type of subbrowser context.
      if (enqueue(path, 'html')) return;
      var el = document.createElement('object');
      el.style.display = 'none';
      el.type = 'text/html';
      el.href = path;
      let lssp = path;
      el.onload = () => {
        ial.debug && console.warn(`Loaded: ${path}`);
        ial.deferLoading[lssp] = false;
        ial.deferLoaded[lssp] = true;
        dequeue(lssp, 'html');
      };
      document.body.appendChild(el);
    };
    var cssfn = path => {
      if (enqueue(path, 'css')) return;
      var el = document.createElement('link');
      el.rel = 'stylesheet';
      el.href = path;
      let lssp = path;
      el.onload = () => {
        ial.debug && console.warn(`Loaded: ${path}`);
        ial.deferLoading[lssp] = false;
        ial.deferLoaded[lssp] = true;
        dequeue(lssp, 'css');
      };
      document.head.appendChild(el);
    };
    var fn = () => {};
    var wfn = path => {
      let mod = false;
      let css = false;
      let async = false;
      let trying = true;
      while (trying) {
        trying = false;
        if (path.startsWith('module:')) {
          mod = trying = true;
          path = path.slice(7);
        }
        if (path.startsWith('css:')) {
          css = trying = true;
          path = path.slice(4);
        }
        if (path.startsWith('async:')) {
          async = trying = true;
          path = path.slice(6);
        }
      }
      path.endsWith('.html') ? hfn(path) : css || path.endsWith('.css') ? cssfn(path) : fn(path, mod, async);
    };
    for (
      var ss, a, c, d = [], i = e.scripts[0], o = 'onreadystatechange', f = 'readyState';
      (ss = iscriptsin.shift());

    ) {
      // Cache & prevent redundant loads.
      const ssp = Array.isArray(ss) ? ss[1] : ss;
      const last = iscriptsin.length === 0;
      let mod;
      if (/three...three.*[.]js/.exec(ssp)) {
        ial.debug && console.warn(`debugging three.js load: ${ssp}`);
      }
      if (/thrax.core.core.*[.]js/.exec(ssp)) {
        ial.debug && console.warn(`debugging core.js load: ${ssp}`);
      }
      try {
        mod = ssp.startsWith('module:');
      } catch (err) {
        debugger;
      }
      ial.debug && console.warn(`${ial.count} defer${mod ? ' module' : ''} loading: ${ssp}`);
      ial.count++;
      // console.log(`round:${ial.deferRound} deferLoadedCount:${ial.deferLoadedCount}`);
      if (ial.deferLoading[ssp] === true) {
        // console.warn(`${ssp} redundant`);
        if (last && onLoadFn) onLoadFn();
        continue;
      }
      ial.deferLoading[ssp] = true;
      fn = (s, mod, async) => {
        if (enqueue(s, 'js', mod)) return;
        a = document.createElement(t);
        if (mod) a.setAttribute('type', 'module');
        !async && a.setAttribute('defer', true);
        let sd = document.body.querySelector('#deferscriptdiv');
        if (!sd) {
          sd = document.createElement('div');
          sd.id = 'deferscriptdiv';
          sd.style.display = 'none';
          try {
            document.body.appendChild(sd);
          } catch (err) { console.warn(`Ignoring error in script ${s}:`, err); }
        }
        'async' in i
          ? ((a.async = async), sd.appendChild(a))
          : i[f] ? (d.push(a), (a[o] = n)) : e.write(`<${t} src="${s}" ${mod ? 'type="module"' : ''} defer></${t}>`);
        let lssp = ssp;
        a.onload = () => {
          ial.debug && console.warn(`Loaded: ${s}${mod ? `, a module`:''}`);
          ial.deferLoading[lssp] = false;
          ial.deferLoaded[lssp] = true;
          dequeue(lssp, 'js');
        };
        iscriptsin[0] ? iscriptsin : (a.onload = onLoadFn);
        a.src = s;
      };
      fns = {'html':hfn, 'css':cssfn, 'js':fn, 'json':fn};
      if (Array.isArray(ss)) {
        const check = ss[0];
        var path = ss[1];
        whenReadyFn(check, () => wfn(path));
      } else wfn(ss);
    }
  })(document, 'script', iscripts);
});

var deferScriptsAlt = (window.deferScriptsAlt = function deferScriptsAlt(iscripts, onLoadFn) {
  // https://www.html5rocks.com/en/tutorials/speed/script-loading/
  !(function(e, t, r) {
    function n() {
      for (; d[0] && d[0][f] === 'loaded'; ) (c = d.shift()), (c[o] = !i.parentNode.insertBefore(c, i));
    }
    for (var s, a, c, d = [], i = e.scripts[0], o = 'onreadystatechange', f = 'readyState'; (s = r.shift()); ) {
      a = e.createElement(t);
      'async' in i
        ? ((a.async = !1), e.head.appendChild(a))
        : i[f] ? (d.push(a), (a[o] = n)) : e.write(`<${t} src="${s}" defer></${t}>`);
      r[0] ? r : (a.onload = onLoadFn);
      a.src = s;
    }
  })(document, 'script', iscripts);
});
// Only expect these arguments: fn, done or fn, done, delay.
window.whenReadyFnm = function whenReadyFnm(fn, done, delayp, startp, lastReportp) {
  var now = Date.now();
  var start = startp || now;
  // var waited = (now - start) / 1000;
  var lastReport = lastReportp || now;
  if (now - start > 3000 && now - lastReport > 3000) {
    lastReport = now;
    console.error('whenReadyFn still waiting:', (now - start) / 1000, ' seconds for:', fn);
  }
  if (fn()) {
    let ret;
    try {
      ret = done();
    } catch (err) { console.error(err); }
    return ret;
  } else {
    var delay = delayp || 10;
    setTimeout(() => {
      whenReadyFnm(fn, done, delay, start, lastReport);
    }, delay);
  }
};
window.whenReadyFnSimple = function whenReadyFnSimple(fn, done, delayp, start, lastReport) {
  if (fn()) {
    done();
  } else {
    var delay = delayp || 10;
    setTimeout(() => {
      whenReadyFn(fn, done, delay, start, lastReport);
    }, delay);
  }
};
window.asyncLoadHtml = function asyncLoadHtml(parent, path) {
  setTimeout(() => {
    var par = parent || window.body;
    var el = document.createElement('div');
    el.innerHTML = `<object type="text/html" data="${path}"></object>`;
    par.appendChild(el);
  }, 0);
};
(function tmp() {
  var track = {};

  function trk(fn, delay) {
    var ret =
      track[fn] ||
      (track[fn] = {
        total: 0,
        lastNotice: 0,
        delay: delay || 10
      });
    return ret;
  }
  window.whenReadyFnAlt = function whenReadyFnAlt(fn, done, _delay) {
    var t = trk(fn, _delay);
    if (_delay) {
      t.delay = _delay;
    }
    if (t.total - t.lastNotice > 1000) {
      console.error('still waiting on ', fn, ' for ', t.total / 1000);
      t.lastNotice = t.total;
    }
    if (fn()) {
      done();
    } else {
      t.total += t.delay;
      setTimeout(() => {
        whenReadyFn(fn, done);
      }, t.delay);
    }
  };
})();

// Obsolete:
// Polymer.importHref(
//  path,
//  () => {ial.deferLoaded[path] = true; console.log(`Loaded: ${path}`);},
//  () => console.warn(path, ' failed to load dynamically.')
// );
