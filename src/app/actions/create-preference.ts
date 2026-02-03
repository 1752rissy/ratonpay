'use server'

import { preference } from "@/lib/mercadopago";

export async function createPaymentPreference(
    billId: string,
    friendId: string,
    amount: number,
    description: string
) {
    try {
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: billId,
                        title: description,
                        quantity: 1,
                        unit_price: amount,
                        currency_id: 'ARS',
                    }
                ],
                external_reference: `${billId}_${friendId}`,
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bill/${billId}?status=success`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bill/${billId}?status=failure`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bill/${billId}?status=pending`,
                },
                auto_return: 'approved',
            }
        });

        return { url: result.init_point };
    } catch (error) {
        console.error("Error creating preference:", error);
        return { error: "Error al generar el pago" };
    }
}
