/***************************************************************************
* DEPENDENCIES
***************************************************************************/

var gulp           = require('gulp'),
    $              = require('gulp-load-plugins')({ pattern: ['gulp-*', 'gulp.*'], replaceString: /\bgulp[\-.]/}),
    browserSync    = require('browser-sync'),
    mainBowerFiles = require('main-bower-files')
//  saveLicense = require('uglify-save-license')
;

/***************************************************************************
* FILE DESTINATIONS
***************************************************************************/

var paths = {
  'root'        : './',
  'vhost'       : 'example.dev',
  'port'        : 3000,
// html
  'htmlDest'    : 'dist/',
  'htmlFiles'   : 'dist/*.html/',
// images
  'imgDest'     : 'dist/images/',
  'imgDir'      : 'src/images/',
// jade
  'jadeFiles'   : ['src/jade/*.jade', 'src/jade/**/*.jade'],
  'jadeDir'     : 'src/jade/*.jade',
// JavaScript
  'jsDir'       : 'src/js/',
  'jsAppFiles'  : 'src/js/app/*.js',
  'jsLibFiles'  : 'src/js/lib/*.js',
  'jsFiles'     : 'src/js/**/*.js',
  'jsDest'      : 'dist/js/',
// scss
  'scssDir'     : 'src/scss/',
// css
  'cssDest'     : 'dist/css/',
};

/***************************************************************************
* bower-init
***************************************************************************/

gulp.task('bower-init', function(){
  var filterJs = $.filter('*.js');
  var filterCss = $.filter('*.css');
  var filterScss = $.filter('*.scss');
  var filterImage = $.filter(['*.png', '*.gif', '*.jpg']);
  return gulp.src(mainBowerFiles())
    .pipe(filterJs)
    .pipe(gulp.dest(paths.jsDir + 'lib/'))
    .pipe(filterJs.restore())
    .pipe(filterCss)
    .pipe($.rename({ prefix: '_m-', extname: '.scss' }))
    .pipe(gulp.dest(paths.scssDir + 'module/'))
    .pipe(filterCss.restore())
    .pipe(filterImage)
    .pipe(gulp.dest(paths.imgDest))
    .pipe(filterImage.restore());
});

/***************************************************************************
* browser-sync
***************************************************************************/

// Local server
// gulp.task('browser-sync', function() {
//   browserSync({
//     proxy: paths.vhost,
//     open: 'external'
//   });
// });

// Static server
gulp.task('browser-sync', function() {
 browserSync({
   server: {
     baseDir: paths.root
   },
   startPath: paths.htmlDest
 });
});

// Reload all browsers
gulp.task('bs-reload', function() {
  browserSync.reload()
});

/***************************************************************************
* image tasks
***************************************************************************/

gulp.task('image-min', function() {
  return gulp.src(paths.imgDest + 'pages/**/*.*')
    .pipe($.imagemin({ optimizationLevel: 3 }))
    .pipe(gulp.dest(paths.imgDest))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('sprite', function() {
  var spriteData = gulp.src(paths.imgDir + 'sprite/*.png')
  .pipe($.spritesmith({
    imgName: 'sprite.png',
    imgPath: '../images/sprite.png',
    cssName: '_m-sprite.scss',
    algorithm: 'top-down',
    padding: 20
  }));
  spriteData.img.pipe(gulp.dest(paths.imgDest));
  spriteData.css.pipe(gulp.dest(paths.scssDir + 'module'));
});

gulp.task('sprite-svg', function() {
  return gulp.src(paths.imgDir + 'sprite-svg/*.svg')
    .pipe($.svgSprite({
      dest: './',
      mode: { symbol: { dest: './' } }
    }))
    .pipe($.rename({
      basename: 'symbol',
      dirname: './',
      prefix: 'sprite' + '.'
    }))
    .pipe(gulp.dest(paths.imgDest + 'sprite-svg'));
});

/*******************************************************************************
 * Jade Tasks
*******************************************************************************/

gulp.task('jade', function() {
  return gulp.src(paths.jadeDir)
    .pipe($.data(function(file) {
      return require('./setting.json');
    }))
    .pipe($.plumber())
    .pipe($.jade({ pretty: true }))
    .pipe(gulp.dest(paths.htmlDest))
    .pipe(browserSync.reload({ stream: true }));
});

/***************************************************************************
* js tasks
***************************************************************************/

gulp.task('jsLib', function() {
  return gulp.src(paths.jsLibFiles)
    .pipe($.concat('lib.js'))
    .pipe($.uglify())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.jsDest))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('jsApp', function() {
  return gulp.src(paths.jsAppFiles)
    .pipe($.concat('script.js'))
    .pipe($.uglify())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.jsDest))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('jsTasks', [
  'jsApp',
  'jsLib'
]);

/***************************************************************************
* Sass tasks
***************************************************************************/

gulp.task('sass', function () {
  return $.rubySass(paths.scssDir, {
      require   : 'sass-globbing',
      sourcemap : false,
      loadPath  : []
    })
    .on('error', function(err) { console.error('Error!', err.message); })
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie 10', 'ie 9'],
      cascade: false
    }))
    .pipe($.csso())
    .pipe(gulp.dest(paths.cssDest))
    .pipe($.filter('**/*.css'))
    .pipe(browserSync.reload({ stream: true }));
});

/***************************************************************************
* gulp tasks
***************************************************************************/

gulp.task('watch', function() {
  gulp.watch([paths.imgDest + 'sprite/*.png'], ['sprite']);
  gulp.watch([paths.imgDir + 'sprite-svg/*.svg'], ['sprite-svg'])
  gulp.watch([paths.htmlFiles], ['bs-reload']);
  gulp.watch([paths.jadeFiles], ['jade']);
  gulp.watch([paths.jsFiles], ['jsTasks']);
  gulp.watch([paths.scssDir + '**/*.scss'], ['sass']);
});

gulp.task('default', [
  'browser-sync',
  'bs-reload',
  'image-min',
  'jade',
  'jsTasks',
  'sass',
  'sprite',
  'sprite-svg',
  'watch'
]);

gulp.task('init', [
  'bower-init',
  'jsTasks'
]);
