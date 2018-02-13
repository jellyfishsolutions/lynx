var gulp = require("gulp");
var clean = require("gulp-clean");
var typescript = require("gulp-tsc");
var watch = require("gulp-watch");
var runSequence = require("run-sequence");
var fs = require("fs");

let config = JSON.parse(fs.readFileSync(__dirname + "/tsconfig.json"));

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
        .src(["src/**", "!src/**/*.ts"])
        .pipe(gulp.dest(config.compilerOptions.outDir));
});

gulp.task("clean", function() {
    return gulp
        .src(config.compilerOptions.outDir, {
            read: false
        })
        .pipe(clean());
});

gulp.task("compile", function() {
    return gulp
        .src(["./src/**/*.ts", "!./lynx/**/node_modules/**"])
        .pipe(typescript(config.compilerOptions))
        .pipe(gulp.dest(config.compilerOptions.outDir));
});

gulp.task("build", function(callback) {
    runSequence("clean", "compile", "copy", callback);
});
