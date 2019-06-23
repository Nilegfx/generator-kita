var Generator = require('yeoman-generator');
var { join } = require('path');
const editJsonFile = require("edit-json-file");
const glob = require('glob')

const dependencyMapper = {
  babel7: {
    dev: true,
    packages: ['@babel/core', '@babel/node', '@babel/preset-env']
  },
  jest: { dev: true, packages: ['jest'] }
}

const suggestedDependencies = Object.keys(dependencyMapper);
const toPackages = (acc, dependency) => [...acc, ...dependencyMapper[dependency].packages];
const isDevDependency = dependency => dependencyMapper[dependency].dev;
const isProductionDependency = dependency => !dependencyMapper[dependency].dev;

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument('name', { required: false });
    this.option('babel'); // This method adds support for a `--babel` flag
    this.answers = {}
  }

  async prompting() {
    const done = this.async();
    const questions = [{
      type: "checkbox",
      name: "dependencies",
      message: "what else to include?",
      choices: suggestedDependencies
    }];

    if (!this.options['name']) {
      questions.unshift({
        type: "input",
        name: "name",
        message: "Your project name"
      });
    }

    try {
      this.answers = await this.prompt(questions);
      done();
    } catch (e) {
      this.error(e)
    }

  }

  configuring() {
    this.projectName = this.answers.name || this.options['name'];
  }

  writing() {
    
    this.log.invoke('writing files .. ');
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

  _installProjectDependencies() {
    const devDependencies = this.answers.dependencies.filter(isDevDependency).reduce(toPackages, []);
    const productionDependencies = this.answers.dependencies.filter(isProductionDependency).reduce(toPackages, []);

    // install dev dependencies
    this.yarnInstall(devDependencies, {
      cwd: this.destinationPath(this.projectName),
      dev: true
    });

    // install production dependencies
    this.yarnInstall(productionDependencies, {
      cwd: this.destinationPath(this.projectName)
    });
  }

  install() {
    this.log('installing dependencies...')
    this._installProjectDependencies();
    this.yarnInstall(null, { cwd: this.destinationPath() });
  }

  end() {
    process.exit(0);
    // this.spawnCommand('code', [this.destinationPath(this.projectName)]);
  }

};

