var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var frontMatter = require('gulp-front-matter');
var marked = require('gulp-marked');
var wrap = require('gulp-wrap');
var nunjucksMd = require('gulp-nunjucks-md');
var assemble = require('assemble')();

var path = require('path'),
	fs = require('fs'),
	url = require('url'),
	argv = require('yargs').argv;

var browserSync = require('browser-sync').create();

var defaultFile = "index.html";
var folder = path.resolve(__dirname + '/public/');

var paths = {
	templates: ['src/app/templates/layout/*'],
	content: ['src/app/content/*'],
	data: ['src/app/data'],
	styles: ['src/app/appearance']
}

/**
 * Task List
 *
 * 1. Compile Sass (SCSS syntax) using sourcemaps
 * 2. Markdown
 * 3. Templating compile to html
 * 4. Live BrowserSync reload
 */

// browserlist variables
var autoprefixer = {
	browsers: [ 'last 2 versions', 'ie >= 9' ]
}

/* add --production to gulp commands to build out for production */
var production = argv.production ? true : false;

gulp.task('sass', function() {
	return gulp
		.src('src/app/appearance/scss/*.scss')
		.pipe( plugins.sourcemaps.init() )
		.pipe( plugins.sass().on('error', plugins.sass.logError) )
		.pipe( plugins.autoprefixer( autoprefixer ) )
		.pipe( plugins.sourcemaps.write('src/appearance/scss/maps') )
		.pipe( gulp.dest('public/assets/css/') )
		.pipe( browserSync.stream() );
});

// gulp.task('pages:build', function() {
// 	gulp.src('src/app/content/**/*.md')
// 		.pipe(frontMatter())
// 		.pipe(marked())
// 		.pipe(wrap(function (data) {
// 			return fs.readFileSync('src/app/templates/layout/layout.njk')
// 				.toString()
// 		}, null, {
// 			engine: 'nunjucks'
// 		}))
// 		.pipe(gulp.dest('public'))
// });

gulp.task('templates:build', function () {
  return gulp.src('src/app/content/*.{html,njk,md}')
	.pipe(nunjucksMd({
	  path: ['src/app/templates/layout/'],
	  ext: '.html',
	  inheritExtension: true,
	  data: 'src/app/data/data.json',
	  marked: true
	}))
	.pipe(plugins.rename('index.html'))
	.pipe(gulp.dest('public'));
});

gulp.task('images:build', function() {
	return gulp.src('src/app/assets/images/*.+(png|jpg|gif)')
		.pipe(plugins.imagemin())
		.pipe(gulp.dest('public/assets/img/'));
});

gulp.task('serve', function() {
	browserSync.init({
		server: {
			baseDir: './public',
			middleware: function(req, res, next) {
				var fileName = url.parse(req.url);
				fileName = fileName.href.split(fileName.search).join("");
				var fileExists = fs.existsSync(folder + fileName);
				if (!fileExists && fileName.indexOf("browser-sync-client") < 0) {
					req.url = "/" + defaultFile;
				}
				return next();
			}
		},
		notify: {
			styles: {
				top: 'auto',
				bottom: '20px',
				right: '20px',
				borderRadius: '14px',
				backgroundColor: '#fff',
				color: '#000',
				boxShadow: '0px 0px 5px 0px rgba( 0, 0, 0, 0.5 )'
			}
		}
	});

	gulp.watch('src/app/appearance/scss/**/*', ['sass']).on( 'change', browserSync.reload );
	gulp.watch('src/app/templates/**/*', ['templates:build']).on( 'change', browserSync.reload );
	gulp.watch('src/app/assets/images/*', ['images:build']).on( 'change', browserSync.reload );
});

gulp.task('build', [
	'sass',
	'pages:build'
]);