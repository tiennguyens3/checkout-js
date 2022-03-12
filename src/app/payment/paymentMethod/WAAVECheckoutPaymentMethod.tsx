import { Customer, PaymentMethod, StoreConfig } from '@bigcommerce/checkout-sdk';
import { noop } from 'lodash';
import React, { Component, ReactNode } from 'react';
import { withCheckout, CheckoutContextProps  } from '../../checkout';
import { MapToPropsFactory } from '../../common/hoc';
import { PaymentFormValues } from '../PaymentForm';
import withPayment, { WithPaymentProps } from '../withPayment';

export interface WAAVECheckoutPaymentMethodProps {
    method: PaymentMethod;
    onUnhandledError?(error: Error): void;
    onSubmitError?(error: Error): void;
}

export interface WithCheckoutPaymentMethodProps {
    config: StoreConfig,
    customer: Customer
    cart: any,
    coupons: any,
    billingAddress: any,
    consignments: any
}

// TODO
// let globalData:WithCheckoutPaymentMethodProps | null = null;

export class WAAVECheckoutPaymentMethod extends Component<
    WAAVECheckoutPaymentMethodProps & 
        WithCheckoutPaymentMethodProps &
        WithPaymentProps
> {
    async componentDidMount(): Promise<void> {
        const {
            method,
            onUnhandledError = noop,
            // config,
            // customer,
            // cart,
            // coupons,
            // billingAddress,
            // consignments,
        } = this.props;

        try {
            console.log(method);
        } catch (error) {
            onUnhandledError(error);
        }
    }

    async componentWillUnmount(): Promise<void> {
        const {
            method,
            onUnhandledError = noop,
        } = this.props;

        try {
            console.log(method);
        } catch (error) {
            onUnhandledError(error);
        }
    }

    createOrder(values: PaymentFormValues): void {
        // debugger

        console.log(values);
        // // onUnhandledError();
        // const lineItems = globalData?.cart.lineItems;

        // const products: any[] = [];
        // lineItems.customItems.map((item: any) => products.push(item));
        // lineItems.digitalItems.map((item: any) => products.push(item));
        // lineItems.giftCertificates.map((item: any) => products.push(item));
        // lineItems.physicalItems.map((item: any) => products.push(item));

        // const discount_amount = globalData?.coupons.reduce((accumulator: any, currentValue: { discountedAmount: any; }) => {
        //     return accumulator + currentValue.discountedAmount
        // }, 0);

        // const storeProfile = globalData?.config.storeProfile;
        // const links = globalData?.config.links;

        // const shippingAddress = globalData?.consignments[0].shippingAddress;
        // const shippingOption = globalData?.consignments[0].selectedShippingOption;
        // const customer = globalData?.customer;

        // const body = {
        //     products,
        //     billing_address: globalData?.billingAddress,
        //     shipping_address: shippingAddress,
        //     shipping_option: shippingOption,
        //     discount_amount,
        //     customer_id: customer ? customer.id : 0,
        //     storeProfile,
        //     links
        // };

        // debugger

        
    }

    render(): ReactNode {
        return (
            <>
                <p>Payment protection program on all your transactions. US &amp; International major credit and debit cards. More about <a href="https://www.getwaave.com/what-is-waave" target="blank">WAAVE</a></p>
                <form method='POST' action=''>
                    <input type="hidden" name="access_key" value="" />
                    <input type="hidden" name="venue_id" value="" />
                    <input type="hidden" name="reference_id" value="" />
                    <input type="hidden" name="amount" value="" />
                    <input type="hidden" name="currency" value="" />
                    <input type="hidden" name="return_url" value="" />
                    <input type="hidden" name="cancel_url" value="" />
                    <input type="hidden" name="callback_url" value="" />
                    <input type="hidden" name="store_id" value="" />
                </form>
            </>
        );
    }
}

const mapFromCheckoutProps: MapToPropsFactory<CheckoutContextProps,
    WithCheckoutPaymentMethodProps,
    WAAVECheckoutPaymentMethodProps> = () => {

    return (context, props) => {

        const {
            method,
        } = props;

        const { checkoutState } = context;

        const {
            data: {
                getCheckout,
                getConfig,
                getCustomer,
                getCart,
                getBillingAddress,
                getCoupons,
                getConsignments
            },
        } = checkoutState;

        const checkout = getCheckout();
        const config = getConfig();
        const customer = getCustomer();
        const cart = getCart();
        const coupons = getCoupons();
        const billingAddress = getBillingAddress();
        const consignments = getConsignments();

        if (!checkout || !config || !customer || !method) {
            return null;
        }

        return {
            config,
            customer,
            cart,
            coupons,
            billingAddress,
            consignments,
        };
    };
};

export default withPayment(withCheckout(mapFromCheckoutProps)(WAAVECheckoutPaymentMethod));