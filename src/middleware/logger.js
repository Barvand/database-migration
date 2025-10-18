import morgan from "morgan";
import chalk from "chalk";

// Custom format tokens
morgan.token("body", (req) => JSON.stringify(req.body));
morgan.token("user-agent", (req) => req.headers["user-agent"]);

const colorfulFormat = (tokens, req, res) => {
  const status = tokens.status(req, res);
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const responseTime = tokens["response-time"](req, res);
  const body = tokens.body(req, res);

  // Choose color based on status
  let color = chalk.white;
  if (status >= 500) color = chalk.redBright;
  else if (status >= 400) color = chalk.yellowBright;
  else if (status >= 300) color = chalk.cyanBright;
  else if (status >= 200) color = chalk.greenBright;

  return [
    chalk.gray(new Date().toISOString()),
    color(`${method} ${url}`),
    chalk.white(`→ ${status}`),
    chalk.magenta(`${responseTime} ms`),
    chalk.blue(`Body: ${body || "{}"}`),
  ].join("  ");
};

export const requestLogger = morgan(colorfulFormat);
