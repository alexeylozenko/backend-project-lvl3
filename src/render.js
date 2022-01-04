import Listr from 'listr';

export default (tasks, forcedRun = false) => {
  if (process.env.DEBUG && !forcedRun) {
    return;
  }
  const listr = new Listr(tasks, { concurrent: false, exitOnError: false });
  listr.run();
};
