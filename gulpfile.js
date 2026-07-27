const { src, dest, parallel } = require('gulp');

function copyIcons() {
  return src('src/**/*.{svg,png}').pipe(dest('dist/'));
}

function copyJson() {
  return src('src/**/*.json').pipe(dest('dist/'));
}

exports.build = parallel(copyIcons, copyJson);
