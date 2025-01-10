export type transactionInterface = {
    _id: string;
    
    user_id: string;
    user_email: string;

    transactionType: "Withdrawal" | "Credit" | "Debit";

    description: string;
    amount: number;

    
    credit?: {
        analytics_id: string;
        release_id: string;
        // revenue: string;
    }

    withdrawal?: {
        payout_id: string;

        exchangeRate: withdrawExchangeInterface,
        narration: string;

        paymentMethod: string;
        currency: string;
        accountNumber: string;
        beneficiaryName: string;
        bankName: string;
        beneficiaryEmail: string;
    };

    status: "Pending" | "Processing" | "Success" | "Complete" | "Failed",

    updatedBy: {
        user_id: string,
        user_email: string,
        name: string
    },
    
    createdAt: string;
    updatedAt: string;
}


export type withdrawExchangeInterface = {
    rate: number,
    source: {
        currency: string,
        amount: number
    },
    destination: {
        currency: string,
        amount: number
    }
}