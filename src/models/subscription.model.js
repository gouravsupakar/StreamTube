import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId,   // one who is subscribing
            ref: "User"
        },

        channel: {
            type: mongoose.Schema.Types.ObjectId,   // one who's channel we are subscribing
            ref: "User"
        }
    },
    
    {timestamps: true}
);


export const Subscription = mongoose.model("Subscription", subscriptionSchema);