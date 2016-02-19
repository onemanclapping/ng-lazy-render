var gulp = require('gulp');
var concat = require('gulp-concat');
var del = require('del');
var Server = require('karma').Server;

var paths = {
  scripts: ['src/module.js', 'src/**/*.js']
};

gulp.task('clean', function() {
  return del(['dist']);
});

gulp.task('scripts', ['clean'], function() {
  return gulp.src(paths.scripts)
    .pipe(concat('ng-lazy-load.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('test', function () {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    action: 'run'
  }).start();
});

gulp.task('default', ['watch', 'scripts']);