import type { TaskConfig, TaskHandler } from "payload";

export const cleanAnonymousUsers: TaskHandler<"CleanAnonymousUsers"> = async ({ req }) => {
  const now = new Date().toISOString();
  console.log(`Running cleanup at ${now}`);

  try {
    const { docs } = await req.payload.find({
      collection: "anonymous-users",
      where: {
        createdAt: {
          less_than: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
        },
      },
      limit: 1000,
    });

    if (docs.length === 0) {
      console.log(`No expired anonymous users found at ${now}`);
      return {
        output: `No expired anonymous users found at ${now}`,
      };
    }

    const anonymousUserIds = docs.map((user) => user.id);

    if (anonymousUserIds.length) {
      await req.payload.db.deleteMany({
        collection: "anonymous-users",
        where: {
          id: {
            in: anonymousUserIds,
          },
        },
      });
    }

    const message = `Cleanup completed at ${now} - ${anonymousUserIds.length} anonymous user(s) deleted`;
    console.log(message);
    return {
      output: message,
    };
  } catch (error) {
    const errorMessage = `Error occurred during cleanup at ${now}: ${error}`;
    console.error(errorMessage);
    return {
      output: errorMessage,
    };
  }
};

export const CleanAnonymousUsers: TaskConfig<"CleanAnonymousUsers"> = {
  slug: "CleanAnonymousUsers",
  schedule: [
    {
      cron: "0 0 * * *", // Every day at midnight
      queue: "nightly",
    },
  ],
  handler: cleanAnonymousUsers,
};
