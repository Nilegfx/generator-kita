const Generator = require('yeoman-generator');
const { join, basename } = require('path');
const Babel = require('../sub-generators/babel');
const BabelPath = require.resolve('../sub-generators/babel');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument('name', { require: true });
    this.projectName = this.options['name'];
  }
  prompting() {
      let done = this.async();
    this.prompt([
      { type: 'confirm', name: 'should', message: 'should we?', default: true }
    ])
    .then(answers => {
        this.log(answers);
        done();
    }).catch(e=> {
        this.log(e);
        done();
    })
  }
  initializing() {
    this.composeWith(
      {
        Generator: Babel,
        path: BabelPath
      },
      {
        name: this.projectName
      }
    );
  }

  writing() {
    this.fs.writeJSON(this.destinationPath(this.projectName, 'package.json'), {
      main: 'index.js'
    });
  }
};
