import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const topic = searchParams.get("topic") || searchParams.get("type");
        const id = searchParams.get("id") || searchParams.get("data.id");

        if (topic === "payment" && id) {
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id });

            if (paymentInfo.status === "approved" && paymentInfo.external_reference) {
                const [billId, friendId] = paymentInfo.external_reference.split("_");

                if (billId && friendId) {
                    const billRef = doc(db, "bills", billId);
                    const billSnap = await getDoc(billRef);

                    if (billSnap.exists()) {
                        const billData = billSnap.data();
                        const updatedFriends = billData.friends.map((f: any) => {
                            if (f.id === friendId) {
                                return { ...f, status: 'paid' };
                            }
                            return f;
                        });

                        await updateDoc(billRef, {
                            friends: updatedFriends
                        });
                    }
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
