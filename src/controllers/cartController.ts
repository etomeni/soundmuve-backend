import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";
import Stripe from 'stripe';

import { cartItemInterface } from "@/typeInterfaces/cart.interface.js";
import { cartModel } from "@/models/cart.model.js";
import { PaymentModel } from "@/models/payments.model.js";
import { releaseModel } from "@/models/release.model.js";
import { couponDiscountModel } from "@/models/couponDiscount.model.js";

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
            cartItems: req.body.cartItems,
            youtubeLink: req.body.youtubeLink,
            instagramFacebookLink: req.body.instagramFacebookLink,
            xLink: req.body.xLink,
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

// discount application - applying to get discount on releases.
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

        // const user_id = req.body.authMiddlewareParam._id;
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
