const gulp = require("gulp");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const prettify = require("gulp-prettify");
const htmlmin = require("gulp-htmlmin");
const sass = require("gulp-sass");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const sassGlob = require("gulp-sass-glob");
const csscomb = require("gulp-csscomb");
const debug = require("gulp-debug");
const cached = require("gulp-cached");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
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
    .pipe(
      prettify({
        indent_size: 2,
        indent_with_tabs: true,
      })
    )
    .pipe(rename({ extname: ".html" }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("dist/"))
    .pipe(browserSync.reload({ stream: true }));
}

function cssTranspile() {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(
      postcss([autoprefixer({ grid: true }), cssnano({ autoprefixer: false })])
    )
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(gulp.dest("dist/css/"))
    .pipe(browserSync.reload({ stream: true }));
}

function scsscombInit() {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(csscomb())
    .pipe(cached("cache"))
    .pipe(debug({ title: "init: " }))
    .pipe(gulp.dest("src/scss/"));
}

function scsscomb() {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(cached("cache"))
    .pipe(csscomb())
    .pipe(cached("cache"))
    .pipe(debug({ title: "comb: " }))
    .pipe(gulp.dest("src/scss/"));
}

function jsTranspile() {
  return gulp
    .src("src/js/**/*.js")
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest("dist/js/"))
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
  gulp.watch("src/scss/**/*", series(scsscombInit, scsscomb, cssTranspile));
  gulp.watch("src/js/**/*", jsTranspile);
  gulp.watch("src/img/**/*", imageMinify);
  done();
}

exports.default = gulp.parallel(server, watch);
exports.imagemin = gulp.series(cleanImage, imageMinify);
