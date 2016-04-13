module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-inview/angular-inview.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'src/module.js',
      'src/**/*.js',
      'tests/**/*.js'
    ],
    preprocessors: {
      'src/**/*.js': 'coverage'
    },
    reporters: ['coverage', 'spec'],
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS2']
  });
};