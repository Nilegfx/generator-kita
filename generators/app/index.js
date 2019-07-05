const Generator = require('yeoman-generator');
const { join, basename } = require('path');
const glob = require('glob');
const { writeFileSync } = require('jsonfile');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument('name', { required: false });
    this.answers = {};
    this.config.defaults({ packages: [] });
    this._customGeneratorsRoot = join(
      this.sourceRoot(),
      '..',
      '..',
      'sub-generators'
    );
    this._customGeneratorsGlob = glob.sync('/*/', {
      root: this._customGeneratorsRoot
    });
  }

  _suggestedDependencies() {
    let customGenerators = this._customGeneratorsGlob.map(g => basename(g));
    return [...customGenerators, ...this.config.get('packages')];
  }

  async prompting() {
    const done = this.async();
    const questions = [
      {
        type: 'checkbox',
        name: 'dependencies',
        message: 'what else to include?',
        choices: this._suggestedDependencies()
      }
    ];

    if (!this.options['name']) {
      questions.unshift({
        type: 'input',
        name: 'name',
        message: 'Your project name'
      });
    }

    try {
      this.answers = await this.prompt(questions);
      done();
    } catch (e) {
      this.error(e);
    }
  }

  configuring() {
    this.projectName = this.answers.name || this.options['name'];
    this.projectExists = !!glob
      .sync('/*/', { root: this.destinationPath() })
      .filter(directory => basename(directory) == this.projectName).length;

    this.answers.dependencies
      .filter(dep => !!~dep.indexOf('kita-customized-'))
      .forEach(dep => {
        this.composeWith(`${this._customGeneratorsRoot}/${dep}`, {
          name: this.projectName
        });
      });
  }

  writing() {
    this.log.invoke('writing files .. ');
    this._copyingTemplate();

    this.log(`adding project to ${this.destinationPath()} workspaces.. `);
    this._addProjectToDestinationWorkspaces();
  }

  _addProjectToDestinationWorkspaces() {
    let packageJsonPath = this.destinationPath('package.json');
    let packagejson = this.fs.readJSON(packageJsonPath);
    let { workspaces = [] } = packagejson;
    let newWorkspaces = [...new Set([...workspaces, this.projectName])];
    let updatedPackagejson = {
      ...packagejson,
      workspaces: newWorkspaces,
      private: true
    };

    writeFileSync(packageJsonPath, updatedPackagejson, {
      spaces: 2,
      EOL: '\r\n'
    });
    // this.fs.extendJSON(packageJsonPath, {
    //   workspaces: newWorkspaces,
    //   private: true
    // });
  }

  _copyingTemplate() {
    const staticFiles = glob.sync('**/*', {
      dot: true,
      ignore: 'static/package.json',
      cwd: this.templatePath('static')
    });

    if(!this.projectExists){
      this.fs.copyTpl(
        this.templatePath('static/package.json'),
        this.destinationPath(join(this.projectName, 'package.json')),
        { projectName: this.projectName }
      );
    }

    for (let file of staticFiles) {
      this.fs.copyTpl(
        this.templatePath('static', file),
        this.destinationPath(join(this.projectName, file)),
        { projectName: this.projectName }
      );
    }
  }

  _installProjectDependencies() {
    let packages = this.answers.dependencies.filter(
      dep => !~dep.indexOf('kita-customized-')
    );
    this.yarnInstall(packages, {
      cwd: this.destinationPath(this.projectName)
    });
  }

  install() {
    this.log('installing dependencies...');
    this._installProjectDependencies();
    this.yarnInstall(null, { cwd: this.destinationPath() });
  }

  end() {
    this.spawnCommand('code', [this.destinationPath(this.projectName)]);
  }
};
