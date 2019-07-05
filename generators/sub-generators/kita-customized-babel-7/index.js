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
    let currentLaunchConfigPath = this._projectPath('.vscode', 'launch.json');
    let babelNodeLaunchConfigPath = this.templatePath('launch.json');
    let babelRCPath = this.templatePath('.babelrc');
    let babelRCDistPath = this._projectPath('.babelrc');
    let currentLaunchJson = this.fs.readJSON(currentLaunchConfigPath);
    let babelNodeLaunchConfig = this.fs.readJSON(babelNodeLaunchConfigPath);
    let { configurations: babelLunchCOnfigs } = babelNodeLaunchConfig;
    let { configurations } = currentLaunchJson;
    this.fs.writeJSON(currentLaunchConfigPath, {
      ...currentLaunchJson,
      configurations: [...configurations, ...babelLunchCOnfigs]
    });
    this.fs.copy(babelRCPath, babelRCDistPath);
  }

  install() {
    this.yarnInstall(['@babel/core', '@babel/node', '@babel/preset-env'], {
      cwd: this._projectPath()
    });
  }
};
