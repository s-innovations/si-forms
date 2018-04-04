module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.initConfig({
        copy: {
            build:{
                files: [
                    { expand: true, cwd: "src", src: ["**/*.less", "**/*.json", "**/templates/**/*.html"], dest: "artifacts/src" }
                ]//
            }
        }
    });
}