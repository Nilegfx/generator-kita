var Generator = require('yeoman-generator');
var { join } = require('path');
const editJsonFile = require("edit-json-file");
const glob = require('glob')

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument('name', { required: false });
    this.option('babel'); // This method adds support for a `--babel` flag
  }

  initializing() {
    this.projectName = this.options['name'];
  }

  async prompting() {

    if (!this.projectName) {
      const answers = await this.prompt([
        {
          type: "input",
          name: "name",
          message: "Your project name"
        }
      ]);
      this.projectName = answers.name;
    }
  }

  writing() {
    this.log('writing files .. ');
    this._copyingTemplate();
    this.log(`adding project to ${this.destinationPath()} workspaces.. `);
    this._addProjectToDestinationWorkspaces();

  }

  _addProjectToDestinationWorkspaces() {
    let packageFile = editJsonFile(this.destinationPath('package.json'));
    let currentWorkspaces = packageFile.get('workspaces') || [];
    let newWorkspaces = [...new Set([...currentWorkspaces, this.projectName])];
    packageFile.set('workspaces', newWorkspaces);
    packageFile.set('private', true);
    packageFile.save();
  }

  _copyingTemplate() {
    const root = this.templatePath('static')
    const files = glob.sync('**', { dot: true, cwd: root });

    for (let i in files) {
      this.fs.copyTpl(
        this.templatePath(`static/${files[i]}`),
        this.destinationPath(join(this.projectName, files[i])),
        { projectName: this.projectName }
      )
    }
  }

  install() {
    this.log('installing dependencies...')
    this.yarnInstall(null, { cwd: this.destinationPath() });
  }

  end() {
    this.spawnCommand('code', [this.destinationPath(this.projectName)]);
  }

};

