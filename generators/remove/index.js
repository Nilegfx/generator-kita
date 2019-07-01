const Generator = require('yeoman-generator');
const { join } = require('path');
const trash = require('trash');
const { writeFileSync } = require('jsonfile');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument('name', { required: false });
    this.answers = [];
  }

  async prompting() {
    const questions = [
      {
        type: 'confirm',
        name: 'detach_workspace',
        message:
          'Are you sure you want to remove this project from yarn workspaces?'
      }
    ];

    if (!this.options['name']) {
      questions.unshift({
        type: 'input',
        name: 'name',
        message: 'Which project?'
      });
    }

    try {
      this.answers = await this.prompt(questions);
    } catch (e) {
      this.log.error(e);
    }
  }

  configuring() {
    this.projectName = this.answers.name || this.options['name'];
    this.desiredProjectPath = this.destinationPath(this.projectName);
    // exists works with files not directories
    const fileToCheck = join(this.desiredProjectPath, 'package.json');
    let exists = this.fs.exists(fileToCheck);
    this.projectExists = exists;
  }

  async writing() {
    this._deleteProjectDirectory();
    this._removeProjectFromDestinationWorkspaces();
  }

  async _deleteProjectDirectory() {
    await trash(this.desiredProjectPath);
  }

  _removeProjectFromDestinationWorkspaces() {
    let packageJsonPath = this.destinationPath('package.json');
    let packagejson = this.fs.readJSON(packageJsonPath);
    let { workspaces = [] } = packagejson;
    let newWorkspaces = workspaces.filter(
      workspace => this.projectName !== workspace
    );
    let updatedPackagejson = { ...packagejson, workspaces: newWorkspaces };

    writeFileSync(packageJsonPath, updatedPackagejson, {
      spaces: 2,
      EOL: '\r\n'
    });
  }

  install() {
    this.log.invoke('removing unused dependencies .. ');
    this.yarnInstall(null, { cwd: this.destinationPath() });
  }

  end() {
    // process.exit(0);
  }
};
