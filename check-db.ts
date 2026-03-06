import mongoose from 'mongoose';
import Subscription from './lib/models/Subscription';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const subs = await Subscription.find().sort({ createdAt: -1 }).limit(10).lean();
    for (const s of subs) {
        console.log(s.status, s.plan, s.createdAt);
    }
    process.exit(0);
}
run();
