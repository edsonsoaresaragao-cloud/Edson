import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

// Keep the queue consumer in the existing Render service, including free plans.
export function startServices(commands) {
  let stopping = false;
  let exitCode = 0;
  let timer;
  const children = commands.map(([command, ...args]) =>
    spawn(command, args, { stdio: "inherit", env: process.env }),
  );
  function stop(code) {
    if (stopping) return;
    stopping = true;
    exitCode = code;
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGTERM");
    }
    timer = setTimeout(() => {
      for (const child of children) {
        if (child.exitCode === null && child.signalCode === null)
          child.kill("SIGKILL");
      }
    }, 10000);
    timer.unref();
  }
  process.once("SIGTERM", () => stop(0));
  process.once("SIGINT", () => stop(0));
  let remaining = children.length;
  for (const child of children) {
    child.once("error", () => stop(1));
    child.once("close", (code) => {
      // Either service ending unexpectedly must trigger a Render restart.
      stop(code || 1);
      if (--remaining === 0) {
        clearTimeout(timer);
        process.exit(exitCode);
      }
    });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServices([
    [process.execPath, process.argv[2] || ".next/standalone/server.js"],
    [process.execPath, "--import", "tsx", "scripts/worker.ts"],
  ]);
}
