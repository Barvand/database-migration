import morgan from "morgan";
import chalk from "chalk";

// Custom token for body (safe for dev)
morgan.token("body", (req) => {
  const body = { ...req.body };
  if (body.password) body.password = "*****"; // mask sensitive info
  return JSON.stringify(body);
});

// Token for IP address
morgan.token("ip", (req) => req.ip || req.connection.remoteAddress);

// Token for User-Agent
morgan.token("agent", (req) => req.headers["user-agent"]);

const colorfulFormat = (tokens, req, res) => {
  const status = tokens.status(req, res);
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const responseTime = tokens["response-time"](req, res);
  const ip = tokens.ip(req, res);
  const agent = tokens.agent(req, res);
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
    chalk.blue(`IP: ${ip}`),
    chalk.gray(`Agent: ${agent}`),
    chalk.cyan(`Body: ${body}`),
  ].join("  ");
};

export const requestLogger = morgan(colorfulFormat);
