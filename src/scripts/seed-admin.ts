import { ensureAdminUser, defaultAdminCredentials } from "../auth/store.js";

async function main() {
  const admin = await ensureAdminUser();
  const { username, password } = defaultAdminCredentials();
  console.log(`Admin ready: ${admin.username} (${admin.id})`);
  console.log(`Login with username="${username}" password="${password}"`);
  console.log("Prefer: npm run db:bootstrap（会同时种子面试题与社区）");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
