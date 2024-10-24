import { currencyInterface } from "@/typeInterfaces/payout.interface.js";

export const currencies: currencyInterface[] = [
    {
        currency_code: "USD",
        currency_symbol: "$",
        currency_name: "United States Dollar"
    },
    {
        currency_code: "EUR",
        currency_symbol: "€",
        currency_name: "Euro"
    },
    {
        currency_code: "NGN",
        currency_symbol: "₦",
        currency_name: "Nigerian Naira"
    },
    {
        currency_code: "GHS",
        currency_symbol: "₵",
        currency_name: "Ghanaian Cedi"
    },
    {
        currency_code: "TZS",
        currency_symbol: "TSh",
        currency_name: "Tanzanian Shilling"
    },
    {
        currency_code: "UGX",
        currency_symbol: "USh",
        currency_name: "Ugandan Shilling"
    },
    {
        currency_code: "XOF",
        currency_symbol: "CFA",
        currency_name: "West African CFA Franc"
    },
    {
        currency_code: "XAF",
        currency_symbol: "FCFA",
        currency_name: "Central African CFA Franc"
    }
];
