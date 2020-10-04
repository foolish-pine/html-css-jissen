const gulp = require("gulp");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const prettify = require("gulp-prettify");
const sass = require("gulp-sass");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const sassGlob = require("gulp-sass-glob");
const stylelint = require("stylelint");
const debug = require("gulp-debug");
const cached = require("gulp-cached");
const postcss = require("gulp-postcss");
const postcssScss = require("postcss-scss");
const autoprefixer = require("autoprefixer");
const eslint = require("gulp-eslint");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const pngquant = require("imagemin-pngquant");
const del = require("del");
const browserSync = require("browser-sync");
const { series } = require("gulp");

sass.compiler = require("node-sass");

function htmlTranspile() {
  return gulp
    .src(["src/ejs/**/*.ejs", "!" + "src/ejs/**/_*.ejs"])
    .pipe(plumber({ errorHandler: notify.onError("<%= error.message %>") }))
    .pipe(ejs())
    .pipe(rename({ extname: ".html" }))
    .pipe(
      prettify({
        indent_size: 2,
        indent_with_tabs: true,
      })
    )
    .pipe(gulp.dest("dist/"))
    .pipe(browserSync.reload({ stream: true }));
}

function cssTranspile() {
  return gulp
    .src("src/scss/**/*.scss", { sourcemaps: true })
    .pipe(sassGlob())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(postcss([autoprefixer({ grid: true })]))
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(gulp.dest("dist/css/", { sourcemaps: "." }))
    .pipe(browserSync.reload({ stream: true }));
}

function scssStylelintInit() {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(postcss([stylelint({ fix: true })], { syntax: postcssScss }))
    .pipe(cached("cache"))
    .pipe(debug({ title: "init: " }))
    .pipe(gulp.dest("src/scss/"));
}

function scssStylelint() {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(cached("cache"))
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(postcss([stylelint({ fix: true })], { syntax: postcssScss }))
    .pipe(cached("cache"))
    .pipe(debug({ title: "lint: " }))
    .pipe(gulp.dest("src/scss/"));
}

function jsEslintInit() {
  return gulp
    .src("src/js/**/*.js")
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(eslint({ useEslintrc: true, fix: true }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(cached("cache"))
    .pipe(debug({ title: "init: " }))
    .pipe(gulp.dest("src/js/"));
}

function jsEslint() {
  return gulp
    .src("src/js/**/*.js")
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(cached("cache"))
    .pipe(eslint({ useEslintrc: true, fix: true }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(cached("cache"))
    .pipe(debug({ title: "lint: " }))
    .pipe(gulp.dest("src/js/"));
}

function jsTranspile() {
  return gulp
    .src("src/js/**/*.js", { sourcemaps: true })
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest("dist/js/", { sourcemaps: "." }))
    .pipe(browserSync.reload({ stream: true }));
}

function imageMinify() {
  return gulp
    .src("src/img/**/*", { since: gulp.lastRun(imageMinify) })
    .pipe(plumber({ errorHandler: notify.onError("<%= error.message %>") }))
    .pipe(
      imagemin([
        imagemin.gifsicle({ optimizationLevel: 3 }),
        pngquant({ quality: [0.65, 0.8], speed: 1 }),
        imageminJpegtran({ progressive: true }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
            },
          ],
        }),
      ])
    )
    .pipe(gulp.dest("dist/img/"))
    .pipe(browserSync.reload({ stream: true }));
}

function cleanImage() {
  return del(["dist/img/"]);
}

function server(done) {
  browserSync.init({
    server: {
      baseDir: "dist/",
    },
  });
  done();
}

function watch(done) {
  gulp.watch("src/ejs/**/*", htmlTranspile);
  gulp.watch("src/scss/**/*", series(scssStylelint, cssTranspile));
  gulp.watch("src/js/**/*", series(jsEslint, jsTranspile));
  gulp.watch("src/img/**/*", imageMinify);
  done();
}

exports.default = gulp.series(scssStylelintInit, cssTranspile, jsEslintInit, jsTranspile, watch, server);
exports.imagemin = gulp.series(cleanImage, imageMinify);
