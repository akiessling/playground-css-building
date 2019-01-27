var gulp = require('gulp')
var sass = require('gulp-sass')
var babel = require('gulp-babel')
var concat = require('gulp-concat')
var uglify = require('gulp-uglify')
var rename = require('gulp-rename')
var cleanCSS = require('gulp-clean-css')
var postcss = require('gulp-postcss')
var autoprefixer = require('autoprefixer')
var cssnano = require('cssnano')
var postcssCriticalSplit = require('postcss-critical-split')
var del = require('del')
var sourcemaps = require('gulp-sourcemaps')

var paths = {
  styles: {
    src: 'src/styles/**/*.scss',
    dest: 'dist/styles/'
  },
  scripts: {
    src: 'src/scripts/**/*.js',
    dest: 'dist/scripts/'
  }
}

/* Not all tasks need to use streams, a gulpfile is just another node program
 * and you can use all packages available on npm, but it must return either a
 * Promise, a Stream or take a callback and call it
 */
function clean () {
  // You can use multiple globbing patterns as you would with `gulp.src`,
  // for example if you are using del 2.0 or above, return its promise
  return del([ 'dist' ])
}

/*
 * Define our tasks using plain functions
 */

var processors = [
  //   autoprefixer,
  //   require('postcss-critical-split'),
  //   cssnano
]

function styles () {
  return gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(sourcemaps.write())
    // .pipe(postcss(processors))
    // pass in options to the stream
    .pipe(gulp.dest(paths.styles.dest))
}

function criticalStyles () {
  var splitOptions = getSplitOptions(true)

  return gulp.src(['**/*.css', '!**/*' + splitOptions.suffix + '.css'], {'cwd': paths.styles.dest})
    .pipe(sourcemaps.init({'loadMaps': true}))
    .pipe(postcss([postcssCriticalSplit(splitOptions)]))
    .pipe(rename({'suffix': splitOptions.suffix}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.styles.dest))
}

function remainingStyles () {
  var splitOptions = getSplitOptions(false)

  return gulp.src(['**/*.css', '!**/*' + splitOptions.suffix + '.css'], {'cwd': paths.styles.dest})
    .pipe(sourcemaps.init({'loadMaps': true}))
    .pipe(postcss([postcssCriticalSplit(splitOptions)]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.styles.dest))
}

function getSplitOptions (isCritical) {
  var options = {
    'start': 'critical:start',
    'stop': 'critical:end',
    'suffix': '-critical'
  }

  if (isCritical === true) {
    options.output = postcssCriticalSplit.output_types.CRITICAL_CSS
  } else {
    options.output = postcssCriticalSplit.output_types.REST_CSS
  }

  return options
}

function scripts () {
  return gulp.src(paths.scripts.src, { sourcemaps: true })
    .pipe(babel())
    .pipe(uglify())
    .pipe(concat('main.min.js'))
    .pipe(gulp.dest(paths.scripts.dest))
}

function watch () {
  gulp.watch(paths.scripts.src, scripts)
  gulp.watch(paths.styles.src, styles)
}

/*
 * You can use CommonJS `exports` module notation to declare tasks
 */
exports.clean = clean
exports.styles = styles
exports.scripts = scripts
exports.watch = watch
exports.criticalStyles = criticalStyles
exports.remainingStyles = remainingStyles

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
var build = gulp.series(clean, gulp.parallel(styles, scripts), gulp.parallel(criticalStyles, remainingStyles))

/*
 * You can still use `gulp.task` to expose tasks
 */
gulp.task('build', build)

/*
 * Define default task that can be called by just running `gulp` from cli
 */
gulp.task('default', build)
