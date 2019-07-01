const Generator = require('yeoman-generator');
const npmName = require('npm-name');

const isValidPackage = async packagename => {
    let isAvailable = await npmName(packagename);
    return isAvailable ? 'this is not a valid/installable package, pleasea try again': true;
  }
module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.packages = [];
  }

  async _ask() {
    let answers = await this.prompt([
      {
        type: 'input',
        name: 'packagename',
        message: 'which package?',
        validate: isValidPackage
      },
      {
        type: 'confirm',
        name: 'askAgain',
        message: 'Add another package?',
        default: false
      }
    ]);

    this.packages.push({ name: answers.packagename });

    if (answers.askAgain) {
      await this._ask();
    }
  }

  async prompting() {
    await this._ask();
  }

  configuring() {
    let currentPackages = this.config.get('packages') || [];
    let newPackageNames = this.packages.map(({ name }) => name);
    let updatedPackages = [
      ...new Set([...currentPackages, ...newPackageNames])
    ];
    this.config.set('packages', updatedPackages);
  }
};
