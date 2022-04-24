const glob = require("glob");

const express = require("express");
const app = express();

const name = "weetcubes";

const getPort = (port) => {
  if (process.env.SITE_PORT) {
    try {
      port = parseInt(process.env.SITE_PORT);
    } catch (ex) {
      // Suppress exception
      console.log("Exception parsing SITE_PORT: ", ex);
    }
  }
  const args = process.argv.slice(2);
  if (args.length > 0) {
    try {
      port = parseInt(args[0]);
    } catch (ex) {
      // Suppress exception
      console.log("Exception parsing site port from first argument: ", ex);
    }
  }
  return port;
};
const port = getPort(3000);

const getRootPath = () => {
  if (process.env.SITE_ROOT) {
    return process.env.SITE_ROOT;
  }
  return "";
};
const root = getRootPath();

async function getDemos() {
  return new Promise((respond, reject) => {
    glob("../www/*.html", {}, function (err, files) {
      if (err) {
        console.log(err);
        reject(err);
      }
      // files is an array of filenames.
      console.log(files);
      respond(
        files.map((file) => {
          const m = file.match(/www\/(\w+)\.html/);
          [1];
          return m ? m[1] : null;
        })
      );
    });
  });
}

app.get(root, async (req, res) => {
  resp = "";
  const write = (text) => {
    resp += text + "\n";
  };

  write(`<!DOCTYPE html>`);
  write(`<html>`);
  write(`<head>`);
  write(`<title>${name}</title>`);
  write(`</head>`);
  write(`<body>`);
  write(
    `<h1>${name} <a href='${root}/coverage'>Coverage</a> <a href='${root}/docs'>Docs</a></h1>`
  );
  write(
    `<p>This library is available as JavaScript UMD module: <a href='${root}/parsegraph-${name}.js'>parsegraph-${name}.js</a></p>`
  );
  write(`<h2>Samples &amp; Demos</h2>`);
  write(`<ul>`);
  (await getDemos()).forEach((demo) => {
    demo && write(`<li><a href='${root}/${demo}.html'>${demo}</li>`);
  });
  write(`</ul>`);
  write(`</body>`);
  write(`</html>`);

  res.end(resp);
});

app.use(root, express.static("../src"));
app.use(root, express.static("../dist"));
app.use(root, express.static("../www"));

app.listen(port, () => {
  console.log(
    `See ${name} build information at http://localhost:${port}${root}`
  );
});
