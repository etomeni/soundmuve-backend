import cron from "node-cron";
import { releaseModel } from "@/models/release.model.js";
import { userModel } from "@/models/users.model.js";
import { 
    sendReleaseReminder1Mail, sendReleaseReminder2Mail, 
    sendReleaseReminder3Mail, sendReleaseReminder4Mail 
} from "@/util/mail.js";


export const runReleaseReminderJob = async () => {
    // Cron job runs every 1 hour
    cron.schedule("0 * * * *", async () => {
        console.log("Running release reminder job...");
    
        const now = new Date();
        // const reminderStages = [
        //     { stage: 0, minHours: 2, maxHours: 24 }, // 2 - 24 hours
        //     { stage: 1, daysAgo: 2 }, // After 2 days
        //     { stage: 2, daysAgo: 4 }, // After 4 days
        //     { stage: 3, daysAgo: 7 }, // After 7 days
        //     { stage: 4, daysAgo: 30 }, // Monthly reminder
        // ];

        const reminderStages = [
            { stage: 1, minHours: 2, maxHours: 3, key: "2-3_hours" },
            { stage: 2, daysAgo: 1, key: "24_hours" },
            { stage: 3, daysAgo: 3, key: "3_days" },
            { stage: 4, daysAgo: 7, key: "7_days" },
            { stage: 5, daysAgo: 30, key: "30_days" },
        ];
        

        for (const { stage, minHours, maxHours, daysAgo, key } of reminderStages) {
            let query: any = { status: { $in: ["Incomplete", "Unpaid"] }, remindersSent: stage - 1 };
    
            if (minHours !== undefined && maxHours !== undefined) {
                // First reminder: 2 - 24 hours old
                query.createdAt = {
                    $gte: new Date(now.getTime() - maxHours * 60 * 60 * 1000),
                    $lte: new Date(now.getTime() - minHours * 60 * 60 * 1000),
                };
            } else if (daysAgo !== undefined) {
                // Later reminders: After specific days
    
                query.createdAt = {
                    $lte: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
                };
            }
    
            const releases = await releaseModel.find(query);
            
            for (const release of releases) {
                const userData = await userModel.findById(release.user_id).lean();
                const releaseUrl = release.releaseType == "single" ? `https://soundmuve.com/account/create-single-release?release_id=${release.id}` : `https://soundmuve.com/account/create-album-release-details?release_id=${release.id}`;

                if (key == "2-3_hours") {
                    sendReleaseReminder1Mail(release.email, `${userData?.firstName} ${userData?.lastName}`, releaseUrl );
                } else if (key == "24_hours") {
                    sendReleaseReminder2Mail(release.email, `${userData?.firstName} ${userData?.lastName}`, releaseUrl );
                } else if (key == "3_days") {
                    sendReleaseReminder3Mail(release.email, `${userData?.firstName} ${userData?.lastName}`, releaseUrl );
                } else if (key == "7_days") {
                    sendReleaseReminder4Mail(release.email, `${userData?.firstName} ${userData?.lastName}`, releaseUrl );
                } else if (key == "30_days") {
                    sendReleaseReminder3Mail(release.email, `${userData?.firstName} ${userData?.lastName}`, releaseUrl );
                }


                release.remindersSent = stage;
                await release.save();
            }
        }
    });
};
