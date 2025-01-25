import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";
import Stripe from 'stripe';
import moment from "moment";

import { cartItemInterface } from "@/typeInterfaces/cart.interface.js";
import { cartModel } from "@/models/cart.model.js";
import { PaymentModel } from "@/models/payments.model.js";
import { releaseModel } from "@/models/release.model.js";
import { couponDiscountModel } from "@/models/couponDiscount.model.js";
import { logActivity } from "@/util/activityLogFn.js";
import { transactionModel } from "@/models/transaction.model.js";

const stripe = new Stripe(`${process.env.STRIPE_SECRET_KEY}`);


export const addToCartCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        const user_id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        const data2db = {
            user_id,
            user_email,
            release_id: req.body.release_id,
            artistName: req.body.artistName,
            coverArt: req.body.coverArt,
            price: req.body.price,
            releaseType: req.body.releaseType,
            title: req.body.title
        };

        const newCart = new cartModel(data2db);
        const newCartResponds = await newCart.save();
        if (!newCartResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to save cart details"
            });
        }

        // get all cart items
        const cartItems = await getAllCartItems(user_id);
        if (!cartItems) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "cart items not found"
            });
        }

        logActivity(req, `Added release item to cart`, user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: cartItems,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const getAllCartItemCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        const user_id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;

        // get all cart items
        const cartItems = await getAllCartItems(user_id);
        if (!cartItems) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "cart items not found"
            });
        }

        logActivity(req, `Gets all cart items`, user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: cartItems,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// remove from cart by ID
export const removeFromCartCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };
        
        const user_id = req.body.authMiddlewareParam._id;

        const deletedCartItem = await cartModel.findByIdAndDelete(req.params.cart_id || '');
        if (!deletedCartItem) {
          return res.status(404).json({
              status: false,
              statusCode: 404,
              message: "cart item not found"
          });
        }

        // get all cart items
        const cartItems = await getAllCartItems(user_id);
        if (!cartItems) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "cart items not found"
            });
        }

        logActivity(req, `Removed release item to cart`, user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: cartItems,
            message: "Successful! item removed"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// discount application - applying to get discount on releases.
export const couponDiscountCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        const user_id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        const data2db = {
            user_id, user_email,
            user_name: req.body.user_name,
            cartItems: req.body.cartItems,
            youtubeLink: req.body.youtubeLink,
            instagramFacebookLink: req.body.instagramFacebookLink,
            xLink: req.body.xLink,
            status: "Pending"
        };

        const newCouponDiscount = new couponDiscountModel(data2db);
        const newCouponDiscountResponds = await newCouponDiscount.save();

        if (!newCouponDiscountResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to submit applying for discount"
            });
        }

        logActivity(req, `Applied for discounted release`, user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: newCouponDiscountResponds,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Apply the discount coupon code
export const applyPromoCodeCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        const user_id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;

        const promoCode: string = req.body.promoCode;
        const cartItems: cartItemInterface[] = req.body.cartItems;


        const couponApplication = await couponDiscountModel.findOne({code: promoCode});
        if (!couponApplication) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Incorrect coupon code."
            });
        }

        if (couponApplication.user_id != user_id) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "This coupon code can only be used by the user that applied for it."
            });
        }

        if (couponApplication.status == "Used" || couponApplication.status == "Rejected" || couponApplication.status == "Pending") {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "This coupon code is no longer valid."
            });
        }

        // Calculate the total price for each array
        const sentCartItemsTotalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);
        const couponTotalPrice = couponApplication.cartItems.reduce((acc, item) => acc + item.price, 0);

        // Check if the total prices are equal
        const isPriceEqual = sentCartItemsTotalPrice === couponTotalPrice;

        // Extract unique release IDs from both arrays
        const sentCartItems = new Set(cartItems.map(item => item.release_id));
        const couponCartItems = new Set(couponApplication.cartItems.map(item => item.release_id));

        let hasSameReleaseId = true;

        // Check if both sets have the same size and identical elements
        if (sentCartItems.size !== couponCartItems.size) hasSameReleaseId = false;
        for (let id of sentCartItems) {
            if (!couponCartItems.has(id)) hasSameReleaseId = false;
        }

        // true if conditions are met, false otherwise
        const isBothItemsEqual = isPriceEqual && hasSameReleaseId;

        if (!isBothItemsEqual) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "The coupon code was applied on the wrong cart items."
            });
        }

        const updatedCoupon = await couponApplication.updateOne({
            $set: { 
                status: "Used",
                usedDate: moment().format()
            }
        });
        // Check if the update was successful
        if (!(updatedCoupon.matchedCount > 0 && updatedCoupon.modifiedCount > 0)) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable complete request."
            });
        }

        logActivity(req, `Used a discount coupon code`, user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: couponApplication,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get payment keys and intent
export const getPaymentIntentAndKeysCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        const user_id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;

        const amount = req.body.amount;
   
        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amounts in cents
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true
            }

            // payment_method: paymentMethodId, // Pass the payment method ID received from the frontend
            // confirmation_method: 'manual', // Manual confirmation
            // confirm: true, // Confirm the payment intent immediately
            
        });

        logActivity(req, `Get payment keys and intent`, user_id);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                clientSecret: paymentIntent.client_secret,
                secretKey: '', // process.env.STRIPE_SECRET_KEY,
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,

                // paymentIntent: paymentIntent.
            },
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// successful payment
export const successfulPaymentCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        const user_id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        const cartItems: cartItemInterface[] = req.body.cartItems;
        const paidAmount = req.body.paidAmount;
        const paymentIntent = req.body.paymentIntent;
        const paymentIntentClientSecret = req.body.paymentIntentClientSecret;
        const paymentStatus = req.body.paymentStatus;

        // Step 1 - add it to the order table
        const newPayment = new PaymentModel({
            user_id,
            user_email,
            cartItems,
            paidAmount,
            paymentIntent,
            paymentIntentClientSecret,
            paymentStatus
        });
        const newPaymentResponds = await newPayment.save();
        if (!newPaymentResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to save payment details"
            });
        }


        /* START - add payment to transaction record */

        //  get the total amount of the cart items
        const getTotalAmount = () => {
            if (cartItems.length) {
                const totalPrice = cartItems.reduce((accumulator, currentObject) => {
                    return accumulator + currentObject.price;
                }, 0);
        
                return totalPrice;
            }
            return 0;
        }

        const newTransactionData = {
            user_email: user_email,
            user_id: user_id,

            transactionType: "Payment",

            description: `Payment for music release`,
            amount: paidAmount,

            payment: {
                cartItems,
                paidAmount,
                totalAmount: getTotalAmount(),
                paymentIntent,
                paymentIntentClientSecret,
                paymentStatus
            },

            updatedBy: {
                user_id: '',
                user_email: '',
                name: ''
            },

            status: "Success"
        };
        const newTransaction = new transactionModel(newTransactionData);
        const transactionResult = await newTransaction.save();

        /* END - add payment to transaction record */


        // update the release status
        // remove the items from cart
        cartItems.forEach(async (cart) => {
            // remove the items from cart
            const cartItems = await cartModel.findByIdAndDelete(cart._id);
            // if (!cartItems) {
            //     return res.status(404).json({
            //         status: false,
            //         statusCode: 404,
            //         message: "cart item not found"
            //     });
            // }


            // update the release status
            
            const updatedRelease = await releaseModel.findByIdAndUpdate(
                cart.release_id,
                { 
                    $set: { 
                        status: "Processing",
                        payment_id: newPaymentResponds.id
                    } 
                }, 
                { new: true }
            );
            // if (!updatedRelease) {
            //     return res.status(500).json({
            //         status: false,
            //         statusCode: 500,
            //         message: "unable to update release."
            //     });
            // }

        });

        logActivity(req, `successful payment for a release`, user_id);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: '',
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


export const checkReleaseCartCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        const user_id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        const data2db = {
            user_id,
            user_email,
            release_id: req.body.release_id,
            artistName: req.body.artistName,
            coverArt: req.body.coverArt,
            price: req.body.price,
            releaseType: req.body.releaseType,
            title: req.body.title
        };

        // check if the item is still in cart
        // if not add it to cart else proceed
        // if it returns any error do nothing else navigate to the cart page.

        const releaseCart = await cartModel.findOne({ release_id: data2db.release_id });
        if (!releaseCart) {
            const newCart = new cartModel(data2db);
            const newCartResponds = await newCart.save();
    
            if (!newCartResponds) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: "unable to save cart details"
                });
            }
        }

        const cartItems = await getAllCartItems(user_id);
        if (!cartItems) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "cart items not found"
            });
        }

        logActivity(req, `check release cart`, user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: cartItems,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}



async function getAllCartItems(user_id: string) {
    const cartItems = await cartModel.find({ user_id })
    .sort({ createdAt: -1 })  // Sort by createdAt in descending order
    .exec();

    if (!cartItems) return null;

    return cartItems;
}
