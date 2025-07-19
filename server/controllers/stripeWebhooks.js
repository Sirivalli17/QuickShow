import stripe from "stripe";
import Booking from '../models/Booking.js'
import { inngest } from "../inngest/index.js";

export const stripeWebhooks = async (request, response)=> {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers["stripe-signature"];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig,
            process.env.STRIPE_WEBHOOK_SECRET)
    }catch(error) {
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch(event.type) {
            case "payment_intent.succeeded": {
                 const paymentIntent = event.data.object;
                 const sessionList = await stripeInstance.checkout.sessions.list({
                     payment_intent: paymentIntent.id
                 })

                const session = sessionList.data[0];
                 //const session = event.data.object;
                //console.log("STRIPE EVENT TYPE:", event.type, "METADATA:", event.data.object.metadata);

                console.log("Webhook received for bookingId:", session.metadata?.bookingId);
                const { bookingId } = session.metadata;

                await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentLink: ""
                })

                //Send Confirmation Email
                await inngest.send({
                    name: "app/show.booked",
                    data: {bookingId}
                })
                
                break;

            }

            default:
                console.log('Unhandled event type: ',event.type)
        }
        response.json({received: true})

    }catch(err) {
        console.error("Webhook processing error: ",err);
        response.status(500).send("Internal Server Error");
    }
}

// import stripe from "stripe";
// import Booking from '../models/Booking.js';
// import { inngest } from "../inngest/index.js";

// export const stripeWebhooks = async (request, response) => {
//   const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
//   const sig = request.headers["stripe-signature"];

//   let event;

//   try {
//     event = stripeInstance.webhooks.constructEvent(
//       request.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (error) {
//     return response.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   try {
//     switch (event.type) {
//       case "checkout.session.completed": {
//         const session = event.data.object;

//         // Make sure payment was successful
//         if (session.payment_status === "paid") {
//           const { bookingId } = session.metadata;

//           console.log("✅ Stripe payment completed for bookingId:", bookingId);

//           // Mark booking as paid
//           await Booking.findByIdAndUpdate(bookingId, {
//             isPaid: true,
//             paymentLink: ""
//           });

//           // Trigger confirmation flow
//           await inngest.send({
//             name: "app/show.booked",
//             data: { bookingId }
//           });
//         } else {
//           console.warn("⚠️ Checkout completed but not paid:", session.id);
//         }

//         break;
//       }

//       default:
//         console.log("Unhandled event type:", event.type);
//     }

//     response.json({ received: true });

//   } catch (err) {
//     console.error("Webhook processing error:", err);
//     response.status(500).send("Internal Server Error");
//   }
// };
