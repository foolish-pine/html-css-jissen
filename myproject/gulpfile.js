const gulp = require("gulp");
const sass = require("gulp-sass");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const sassGlob = require("gulp-sass-glob");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const pngquant = require("imagemin-pngquant");
const del = require("del");
const browserSync = require("browser-sync");

sass.compiler = require("node-sass");

function cssTranspile() {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(
      postcss[(autoprefixer({ grid: true }), cssnano({ autoprefixer: false }))]
    )
    .pipe(
      plumber({
        errorHandler: notify.onError("<%= error.message %>"),
      })
    )
    .pipe(gulp.dest("dist/css/"))
    .pipe(browserSync.reload({ stream: true }));
}

function jsTranspile() {
  return gulp.src("srcjs/**/*.js").pipe(
    plumber({ errorHandler: notify.onError("<%= error.message %>") })
      .pipe(uglify())
      .pipe(gulp.dest("dist/js/"))
      .pipe(browserSync.reload({ stream: true }))
  );
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
      baseDir: "src",
    },
  });
  done();
}

function watch(done) {
  gulp.watch(["src/scss/*", "src/scss/**/*"], cssTranspile);
  gulp.watch(["src/js/*", "src/js/**/*"], jsTranspile);
  gulp.watch(["src/img/*", "src/img/**/*"], imageMinify);
  done();
}

exports.default = gulp.parallel(server, watch);
exports.imagemin = gulp.series(cleanImage, imageMinify);
