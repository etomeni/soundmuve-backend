import express from 'express';
import helmet from 'helmet';
import compression from 'compression';

// import fileUpload from 'express-fileupload';

import bodyParser from 'body-parser';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import mongoose from 'mongoose';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import genRoutes from './routes/generalRoutes.js';
import contactRoutes from './routes/contact.js';
import releaseRoutes from './routes/releases.js';
import payoutDetailsRoutes from './routes/payout-details.js';
import recordLabelRoutes from './routes/record-label.js';
import cartRoutes from './routes/cart.route.js';
import transactionsRoutes from './routes/transactionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import blogRoutes from './routes/blogRoutes.js';

import adminReleasesRoutes from './routes/admin/adminRelease.route.js';
import adminRoutes from './routes/admin/admin.route.js';
import adminCouponRoutes from './routes/admin/adminCoupon.route.js';
import adminContactRoutes from './routes/admin/adminContactRoute.js';
import adminNewsletterRoutes from './routes/admin/adminNewsletterRoute.js';
import adminPromotionsRoutes from './routes/admin/adminPromotionsRoute.js';
import adminUsersRoutes from './routes/admin/adminUsersRoute.js';
import adminAnalyticsRoutes from './routes/admin/adminAnalyticsRoute.js';
import adminTransactionsRoutes from './routes/admin/adminTransactionRoute.js';
// import adminBlogRoutes from './routes/admin/adminBlogRoutes.js';

import { runReleaseReminderJob } from '@/jobs/releaseReminders.js';

import { get404, get500 } from './controllers/error.js';

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 5 minutes
	limit: 300, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	// standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	// legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.

    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers

    // validate: false,
    message: "Too many requests from this IP, please try again later",

})


const app = express();

// Apply the rate limiting middleware to all requests.
app.use(limiter);
app.use(helmet());
app.use(cors());
app.use(compression());

const PORT = process.env.PORT || 3000;
// const PORT = 5000;

// app.use(fileUpload());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: "50mb"}));

// app.use(getSource);
// app.use('/api', apiV1Routes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', genRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/releases', releaseRoutes);
app.use('/api/v1/payout-details', payoutDetailsRoutes);
app.use('/api/v1/record-label', recordLabelRoutes);
app.use('/api/v1/checkout', cartRoutes);
app.use('/api/v1/transactions', transactionsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/blog', blogRoutes);

// app.use('/api/v1/users', usersRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/v1/uploads', express.static('uploads'));

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/releases', adminReleasesRoutes);
app.use('/api/v1/admin/coupon', adminCouponRoutes);
app.use('/api/v1/admin/contact', adminContactRoutes);
app.use('/api/v1/admin/newsletter', adminNewsletterRoutes);
app.use('/api/v1/admin/promotions', adminPromotionsRoutes);
app.use('/api/v1/admin/users', adminUsersRoutes);
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);
app.use('/api/v1/admin/transactions', adminTransactionsRoutes);
// app.use('/api/v1/admin/blog', adminBlogRoutes);


app.use(get404);
app.use(get500);

const dbAccess = process.env.MONGO_DB_ACCESS_URI;

if (dbAccess) {
    mongoose.connect(dbAccess)
    .then((res) => {
        // console.log(res);
        app.listen(PORT, () => {
            runReleaseReminderJob();
            console.log(`Server Running on port: http://localhost:${PORT}`);
        })
    })
    .catch((err) => console.log(err));
    
} else {
    app.listen(PORT, () => {
        console.log(`Server Running on port: http://localhost:${PORT}`);
    })
}
