import type { TaskConfig, TaskHandler } from "payload";

export const cleanDraftReports: TaskHandler<"CleanDraftReports"> = async ({ req }) => {
  const now = new Date().toISOString();
  console.log(`Running draft reports cleanup at ${now}`);

  try {
    const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();

    const { docs } = await req.payload.find({
      collection: "reports",
      where: {
        _status: {
          equals: "draft",
        },
        updatedAt: {
          less_than: thirtyDaysAgo,
        },
      },
      limit: 1000,
    });

    if (docs.length === 0) {
      console.log(`No expired draft reports found at ${now}`);
      return {
        output: `No expired draft reports found at ${now}`,
      };
    }

    for (const report of docs) {
      await req.payload.delete({
        collection: "reports",
        id: report.id,
      });
    }

    const message = `Draft reports cleanup completed at ${now} - ${docs.length} draft report(s) deleted`;
    console.log(message);
    return {
      output: message,
    };
  } catch (error) {
    const errorMessage = `Error occurred during draft reports cleanup at ${now}: ${error}`;
    console.error(errorMessage);
    return {
      output: errorMessage,
    };
  }
};

export const CleanDraftReports: TaskConfig<"CleanDraftReports"> = {
  slug: "CleanDraftReports",
  schedule: [
    {
      cron: "0 0 * * *", // Every day at midnight
      queue: "nightly",
    },
  ],
  handler: cleanDraftReports,
};
