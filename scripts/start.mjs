process.env.HOSTNAME = process.env.EDSON_BIND_HOST || "0.0.0.0";
await import("../.next/standalone/server.js");
