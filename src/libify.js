/**
   @license Copyright (c) 2016-2020 Yebo, Inc. Stephen D. Williams
   @prettier

   Usage: libify   frompath pkgpath topath atpre libprefix

   Web browser handling of imports doesn't fit Node-style usage.
   The current practice is to use Node-style imports in web packages, requiring
   a webpack build before use.  This utility fixes up those .js imports so
   that they work directly in the browser without a full build, assuming web
   server configuration mapping all packages to the libprefix, usually /lib.

*/
/* jshint debug:true, camelcase:false, maxcomplexity:false */
const Path = require('path');
const fs = require('fs-extra');
const cli = require('cli');

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function run() {
  try {
    cli.enable('help', 'version', 'status', 'glob', 'catchall');
  } catch (err) {
    console.error(err);
  }
  const pattern = /^(import|export) (.*)['"](.*)['"];?(.*)$/;
  function linefn(fromPath, pkgpath, filePath, line, out, atpre, prepath, libSearch) {
    if (line.includes('sourceMappingURL=')) return;
    let nline = line;
    let pre = '';
    let post = '';
    let match = pattern.exec(line);
    const impexp = match && match[1];
    const imported = match && match[2];
    let from = match && match[3];
    const therest = match && match[4];
    if (match) {
      if (line.includes(' = /')) match = null;
      if (impexp === 'export' && !line.includes(' from ')) match = null;
    }
    if (match) {
      console.log(
        `linefn: ${line}\n  fromPath:${fromPath} pkgpath:${pkgpath} filePath:${filePath} atpre:${atpre} pre:${prepath} libSearch:${libSearch}`,
      );
      let stat;
      // Fix some old code references...
      try {
        if (from.endsWith('lit-html/directives/classMap.js')) {
          const cmfrom = 'lit-html/directives/class-map.js';
          // const cms = `${dpath}/${prefrom}${cmfrom}`;
          // stat = fs.statSync(cms);
          // if (stat.isFile()) from = cmfrom;
          from = cmfrom;
        }
      } catch (err) {}
      let relative = false;
      if (from.startsWith('./')) {
        relative = true;
        from = from.substring(2);
      }
      while (from.startsWith('../')) {
        relative = true;
        debugger;
        if (filePath.includes('/')) {
          filePath = filePath.substring(0, filePath.lastIndexOf('/'));
          from = from.substring(3);
        } else break;
      }
      if (relative) {
        if (filePath.endsWith('/')) filePath = filePath.substring(0, filePath.length - 1);
        from = `${atpre}${filePath}/${from}`;
        if (from.startsWith('/')) from = from.substring(1);
        filePath = '';
      }
      // Special case: tslib_1 from "tslib" -> tslib_1 from "/lib/tslib/tslib.es6.js
      if (imported.includes('tslib_1') && from === 'tslib') {
        from = 'tslib/tslib.es6.js';
      }
      const prefrom = from.startsWith('./') ? `${filePath}/` : '';
      // console.log(`prefrom: ${prefrom}`);
      if (!from.startsWith('/') && !from.startsWith('./')) pre = prepath;
      if (from.endsWith('.js')) {
        console.log(`.js, assuming Found:`);
      } else {
        let dlist = [];
        if (relative) {
          // dlist.unshift(`${fromPath}/${filePath}`);
        }
        dlist = dlist.concat(libSearch);
        dlist.push(fromPath);
        console.log(dlist);
        let done = false;
        for (let i = 0; !done && i < dlist.length; i++) {
          const tryfrom = from.startsWith('@material/mwc-') ? `${from.slice(14)}` : from;
          const dpath = dlist[i];
          // import '@material/package' -> import '/lib/@material/package/package.js'
          try {
            stat = null;
            try {
              stat = fs.statSync(`${dpath}/${prefrom}${from}`);
            } catch (err) {}
            if (!stat) {
              stat = fs.statSync(`${dpath}/${prefrom}${from}.js`);
              from = `${from}.js`;
              done = true;
            }
          } catch (err) {
            // mwc-container has some imports that expect mwc- directories.
            if (!stat) {
              try {
                stat = fs.statSync(`${dpath}/${prefrom}${tryfrom}`);
                from = `@material/${from.slice(14)}`;
              } catch (err) {
                try {
                  stat = fs.statSync(`${dpath}/${prefrom}${tryfrom}.js`);
                  from = `@material/${from.slice(14)}.js`;
                  done = true;
                } catch (err) {}
              }
            }
          }
          if (!stat) {
            const s = `${dpath}/${prefrom}${from}.js`;
            console.log(`Trying: ${s}`);
            try {
              stat = fs.statSync(s);
              from = `${from}.js`;
            } catch (err) {}
            if (stat && stat.isFile()) {
              console.log(`Found: ${s}`);
              done = true;
            }
          }
          if (!done && stat && stat.isDirectory()) {
            const fromPaths = from.split('/');
            console.log(fromPaths);
            let main;
            try {
              let mainjson;
              try {
                mainjson = fs.readFileSync(`${dpath}/${prefrom}${from}/package.json`);
              } catch (err) {
                mainjson = fs.readFileSync(`${dpath}/${prefrom}${tryfrom}/package.json`);
              }
              const pkg = JSON.parse(mainjson);
              main = pkg['jsnext:main'] || pkg.main;
              if (main) {
                const s = `${from}/${main}`;
                console.log(`Found: main: ${s}`);
                from = s;
                done = true;
              }
            } catch (err) {}

            if (!done) {
              const last = fromPaths[fromPaths.length - 1];
              let fstat;
              const s = `${dpath}/${prefrom}${from}/${last}.js`;
              console.log(`Trying: last:${last} ${s}`);
              try {
                fstat = fs.statSync(s);
                from = `${from}/${last}.js`;
              } catch (err) {
                // console.error(err);
              }
              if (fstat && fstat.isFile()) {
                console.log(`Found: ${s}`);
                done = true;
              } else {
                const ss = `${dpath}/${prefrom}${from}`;
                console.log(`Trying: ${ss}`);
                try {
                  fstat = fs.statSync(ss);
                } catch (err) {}
                if (fstat)
                  if (fstat.isFile()) {
                    console.log(`Found: ${ss}`);
                    done = true;
                  } else if (fstat.isDirectory()) {
                    const ssi = `${ss}/index.js`;
                    try {
                      fstat = fs.statSync(ssi);
                      from = `${from}/index.js`;
                      done = true;
                    } catch (err) {}
                  }
              }
            }
          }
        }
        if (!from.endsWith('.js')) post = '.js';
      }
      nline = `${impexp} ${imported}'${pre}${from}${post}'${therest}`;
    }
    out.push(nline);
  }
  function interesting(file) {
    if (!file.endsWith('.js') && !file.endsWith('.html') && !file.endsWith('.css') && !file.endsWith('.scss'))
      return false;
    return true;
  }
  function processFile(fromPath, pkgpath, from, toPath, to, atpre, prepath, libSearch) {
    console.log(`${to}`);
    console.log(`process: from:${from} toPath:${toPath} to:${to}`);
    let content;
    try {
      content = fs.readFileSync(from);
    } catch (err) {
      console.log(err);
    }
    const li = from.lastIndexOf('/');
    let filePath = li ? from.slice(0, li) : '';
    if (filePath.startsWith(fromPath)) filePath = filePath.slice(fromPath.length);
    if (content) {
      const lines = content.toString().split('\n');
      // console.log(`lines:${lines.length}`);
      const out = [];
      if (from.endsWith('.js')) {
        try {
          for (let y = 0; y < lines.length; y++)
            linefn(fromPath, pkgpath, filePath, lines[y], out, atpre, prepath, libSearch);
        } catch (err) {
          console.log(err);
        }
      } else {
        for (let y = 0; y < lines.length; y++) out.push(lines[y]);
      }
      var output = out.join('\n');
      // console.log(output);
      fs.outputFileSync(to, output, err => err && console.error(err));
    }
  }
  console.log(cli.args);
  let [from, pkgpath, to, atpre, lib] = cli.args;
  const libSearch = cli.args.slice(5);
  if (pkgpath.length) from = `${from}`;
  if (!lib.endsWith('/')) lib = `${lib}/`;
  // console.log(from, to, atpre, lib || '', data || '');
  var todo = [];
  var paths = [];
  let dfs = fs.readdirSync(`${from}${pkgpath}`);
  await asyncForEach(dfs, async df => {
    if (df.includes('node_modules')) return;
    todo.push(df);
  });
  while (todo.length) {
    try {
      const path = todo.shift();
      let stat = fs.statSync(`${from}${pkgpath}/${path}`);
      if (stat.isFile())
        processFile(
          from,
          pkgpath,
          `${from}${pkgpath}/${path}`,
          `${to}/${atpre}/${path}`,
          `${to}/${atpre}/${path}`,
          atpre,
          lib,
          libSearch,
        );
      else dfs = fs.readdirSync(`${from}${pkgpath}/${path}`);
      await asyncForEach(dfs, async df => {
        // console.log(`dir: ${entry.path} push: ${rpath}/${df}`);
        try {
          stat = null;
          stat = fs.statSync(`${from}${pkgpath}/${path}/${df}`);
        } catch (err) {}
        if (stat && stat.isFile()) {
          if (!interesting(df)) return;
          processFile(
            from,
            pkgpath,
            `${from}${pkgpath}/${path}/${df}`,
            `${to}/${atpre}/${path}`,
            `${to}/${atpre}/${path}/${df}`,
            atpre,
            lib,
            libSearch,
          );
        } else if (stat && stat.isDirectory()) {
          if (df.includes('node_modules')) return;
          // console.log(`Pushing: ${path}/${df}`);
          todo.push(`${path}/${df}`);
          const dest = `${to}/${atpre}/${path}/${df}`;
          try {
            await fs.ensureDir(dest);
            // console.log(`mkdirp: ${dest}`);
          } catch (err) {
            console.error(err);
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
}
run();

// const template = fs.readFileSync(from, 'utf8');
// const filedata = fs.readFileSync(data, 'utf8');
// const reg = new RegExp(tag, 'g');
// const result = template.replace(reg, filedata);
// fs.outputFile(to, result);
