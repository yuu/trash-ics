const program = require('commander');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('yaml');
const ical = require('ical-generator');
const parseISO = require('date-fns/parseISO');
const addMinutes = require('date-fns/addMinutes');

const getTargets = async (assetsPath) => {
  const files = await fs.readdir(assetsPath);
  const ymls = files.filter((file) => path.extname(file) === '.yml');
  return ymls.map((filename) => {
    const name = path.basename(filename, '.yml');
    return [name, `${assetsPath}/${filename}`];
  });
};

const createIcal = async (name, yml, outputPath) => {
  const calendar = ical({ name: `${name} transh schedule` });

  const eventNames = Object.keys(yml.events);

  eventNames.forEach((eventName) => {
    const dates = yml.events[eventName];
    dates.forEach((date) => {
      const startAt = parseISO(date, 'yyyy-MM-dd');
      const endAt = addMinutes(startAt, 1);
      calendar.createEvent({
        start: startAt,
        end: endAt,
        summary: eventName,
        description: eventName,
        location: '',
      });
    });
  });

  calendar.save(`${outputPath}/${name}.ical`);
};

const main = async () => {
  program
    .version('1.0.0')
    .requiredOption('-a, --assets <path>', 'schdule yaml directory')
    .requiredOption('-o, --output <path>', 'output directory')
    .parse(process.argv);

  const opts = program.opts();

  try {
    const targets = await getTargets(opts.assets);
    if (targets === null) {
      console.log('targets not found');
      return;
    }

    for (let i = 0; i < targets.length; i++) {
      const [name, filepath] = targets[i];
      const file = await fs.readFile(filepath, 'utf8');
      const yml = yaml.parse(file);
      console.log('create the', name);
      createIcal(name, yml, opts.output);
    }
  } catch (err) {
    console.error(err);
  }
};

main();
