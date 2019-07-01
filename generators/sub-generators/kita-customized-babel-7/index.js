const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.projectName = this.options['name'];
  }
  _projectPath(...paths) {
    return this.destinationPath(this.projectName, ...paths);
  }

  writing() {
    this.fs.copy(this.templatePath('.babelrc'), this._projectPath('.babelrc'));
  }

  install() {
    this.yarnInstall(['@babel/core', '@babel/node', '@babel/preset-env'], {
      cwd: this._projectPath()
    });
  }
};
