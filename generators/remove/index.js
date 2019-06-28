const Generator = require('yeoman-generator');
const { join } = require('path');
const trash = require('trash');

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
    const fileToCheck = join(this.desiredProjectPath, 'package.json')
    let exists = this.fs.exists(fileToCheck);
    this.projectExists = exists;
  }

  async writing() {
    if (this.projectExists) {
      this.log.invoke('removing files .. ');
      this._deleteProjectDirectory();
    } else {
      this.log.skip('Project does not exists, skipping');
    }
  }

  async _deleteProjectDirectory() {
    this.sourceRoot(this.destinationPath('nile'));
    this.log(`deleting ${this.desiredProjectPath}`);
    await trash(this.desiredProjectPath);
  }

  install() {
    this.log.invoke('removing unused dependencies .. ');
    this.yarnInstall(null, { cwd: this.destinationPath() });
  }

  end() {
    process.exit(0);
  }
};
