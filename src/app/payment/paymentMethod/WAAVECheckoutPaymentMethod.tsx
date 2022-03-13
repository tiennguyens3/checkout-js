import { PaymentMethod } from '@bigcommerce/checkout-sdk';
import React, { Component, ReactNode } from 'react';

export interface WAAVECheckoutPaymentMethodProps {
    method: PaymentMethod;
    onUnhandledError?(error: Error): void;
    onSubmitError?(error: Error): void;
}

export class WAAVECheckoutPaymentMethod extends Component<WAAVECheckoutPaymentMethodProps> {
    render(): ReactNode {
        return (
            <p>Payment protection program on all your transactions. US &amp; International major credit and debit cards. More about <a href="https://www.getwaave.com/what-is-waave" target="blank">WAAVE</a></p>
        );
    }
}

export default WAAVECheckoutPaymentMethod;