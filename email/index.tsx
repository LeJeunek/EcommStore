import { Resend } from "resend";
import { SENDER_EMAIL, APP_NAME } from "@/lib/constants";
import { Order } from '@/types';

import PurchaseReceiptEmail from "./purchase-receipt";


export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
    // Dynamically import Resend inside the function
    // This prevents the preview server from trying to load it globally
    const { Resend } = await import("resend");
    const { SENDER_EMAIL, APP_NAME } = await import("@/lib/constants");
    
    const resend = new Resend(process.env.RESEND_API_KEY as string);

    await resend.emails.send({
        from: `${APP_NAME} <${SENDER_EMAIL}>`,
        to: order.user.email,
        subject: `Order Confirmation ${order.id}`,
        react: <PurchaseReceiptEmail order={order} />
    });
};