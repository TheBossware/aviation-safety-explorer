import { dbDisconnect } from "@/lib/mongodb";

/**
 * Runs a CLI script's `main`: on failure prints the error and exits with code 1; either way closes
 * the database connection so the process can end.
 */
export function runScript(main: () => Promise<void>): void {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => dbDisconnect());
}
