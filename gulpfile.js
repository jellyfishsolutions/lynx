var gulp = require("gulp");
var fs = require("fs");
var del = require("del");
var ts = require("gulp-typescript");
var merge = require("merge2");
const jsdoc = require('gulp-jsdoc3');
var sourcemaps = require('gulp-sourcemaps');
var path = require('path');

var config = JSON.parse(fs.readFileSync(__dirname + "/tsconfig.json"));

gulp.task("default", function() {
    console.log("Main commands:");
    console.log("build             build the lynx library");
    console.log("\n");
    console.log("Other commands:");
    console.log(
        "compile           compile all the typescript files to the dist folder"
    );
    console.log(
        "copy              copy all the files (!.ts) from the source folder to the dist folder"
    );
    console.log("clean             delete the dist folder");
});

gulp.task("copy", function() {
    return gulp
        .src(["lynx/**", "!lynx/**/*.ts"])
        .pipe(gulp.dest(config.compilerOptions.outDir));
});

gulp.task("clean", function() {
    return del(config.compilerOptions.outDir);
});

gulp.task("compile", function() {
    var tsProject = ts.createProject(__dirname + "/tsconfig.json");
    var tsResult = tsProject.src().pipe(sourcemaps.init()).pipe(tsProject());
    return merge([
        tsResult.js.pipe(gulp.dest(config.compilerOptions.outDir)),
        tsResult.dts.pipe(gulp.dest(config.compilerOptions.outDir)),
        tsResult.js.pipe(sourcemaps.write({
            includeContent: false,
            sourceRoot: function (file) {
                return path.relative(path.dirname(file.path), file.base);
            }
        }))
    ]);
});

gulp.task('doc', function (cb) {
    const config = require(__dirname + '/jsdoc.json');
    config.opts.destination = __dirname + config.opts.destination;
    console.log(__dirname + '/lynx/**/*.ts');
    gulp.src([__dirname + '/README.md',  __dirname + '/lynx/**/*.ts'], { read: false })
        .pipe(jsdoc(config, cb));
});

gulp.task("build", gulp.series("clean", gulp.parallel("copy", "compile")));
