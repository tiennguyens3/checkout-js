import { CheckoutSelectors, EmbeddedCheckoutMessenger, EmbeddedCheckoutMessengerOptions, Order, ShopperConfig, StepTracker, StoreConfig } from '@bigcommerce/checkout-sdk';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import React, { lazy, Component, Fragment, ReactNode } from 'react';

import { withCheckout, CheckoutContextProps } from '../checkout';
import { ErrorLogger, ErrorModal } from '../common/error';
import { retry } from '../common/utility';
import { getPasswordRequirementsFromConfig } from '../customer';
import { isEmbedded, EmbeddedCheckoutStylesheet } from '../embeddedCheckout';
import { CreatedCustomer, GuestSignUpForm, PasswordSavedSuccessAlert, SignedUpSuccessAlert, SignUpFormValues } from '../guestSignup';
import { AccountCreationFailedError, AccountCreationRequirementsError } from '../guestSignup/errors';
import { TranslatedString } from '../locale';
import { Button, ButtonVariant } from '../ui/button';
import { LazyContainer, LoadingSpinner } from '../ui/loading';
import { MobileView } from '../ui/responsive';

import getPaymentInstructions from './getPaymentInstructions';
import mapToOrderSummarySubtotalsProps from './mapToOrderSummarySubtotalsProps';
import OrderConfirmationSection from './OrderConfirmationSection';
import OrderStatus from './OrderStatus';
import PrintLink from './PrintLink';
import ThankYouHeader from './ThankYouHeader';

const OrderSummary = lazy(() => retry(() => import(
    /* webpackChunkName: "order-summary" */
    './OrderSummary'
)));

const OrderSummaryDrawer = lazy(() => retry(() => import(
    /* webpackChunkName: "order-summary-drawer" */
    './OrderSummaryDrawer'
)));

export interface OrderConfirmationState {
    error?: Error;
    hasSignedUp?: boolean;
    isSigningUp?: boolean;
    order?: Order | undefined;
    config?: StoreConfig;
}

export interface OrderConfirmationProps {
    containerId: string;
    embeddedStylesheet: EmbeddedCheckoutStylesheet;
    errorLogger: ErrorLogger;
    orderId: number;
    createAccount(values: SignUpFormValues): Promise<CreatedCustomer>;
    createEmbeddedMessenger(options: EmbeddedCheckoutMessengerOptions): EmbeddedCheckoutMessenger;
    createStepTracker(): StepTracker;
}

interface WithCheckoutOrderConfirmationProps {
    order?: Order;
    config?: StoreConfig;
    loadOrder(orderId: number): Promise<CheckoutSelectors>;
    isLoadingOrder(): boolean;
}

class OrderConfirmation extends Component<
    OrderConfirmationProps & WithCheckoutOrderConfirmationProps,
    OrderConfirmationState
> {
    state: OrderConfirmationState = {};

    private embeddedMessenger?: EmbeddedCheckoutMessenger;

    componentDidMount(): void {
        const {
            // containerId,
            // createEmbeddedMessenger,
            createStepTracker,
            // embeddedStylesheet,
            loadOrder,
            orderId,
        } = this.props;

        const orderIdWAAVE = Number(window.localStorage.getItem('order_id'));
        if (orderIdWAAVE) {
            const config: StoreConfig = JSON.parse(window.localStorage.getItem('store_config') || '');
            const order: Order = {
                "orderId": 151,
                "cartId": "e31deb11-7970-4d4e-b922-67c71f9d7e15",
                "currency": {
                    "name": "US Dollar",
                    "code": "USD",
                    "symbol": "$",
                    "decimalPlaces": 2
                },
                "isTaxIncluded": false,
                "baseAmount": 25,
                "discountAmount": 0,
                "orderAmount": 25.05,
                "orderAmountAsInteger": 2505,
                "shippingCostTotal": 0.05,
                "shippingCostBeforeDiscount": 0.05,
                "handlingCostTotal": 0,
                "giftWrappingCostTotal": 0,
                "lineItems": {
                    "physicalItems": [
                        {
                            "id": 67,
                            "productId": 111,
                            "name": "[Sample] Smith Journal 13",
                            "url": "https://home-v6.mybigcommerce.com/smith-journal-13/",
                            "sku": "SM13",
                            "quantity": 1,
                            "isTaxable": true,
                            "giftWrapping": undefined,
                            "imageUrl": "https://cdn11.bigcommerce.com/s-7vae2blerm/products/111/images/371/smithjournal1.1646968004.220.290.jpg?c=1",
                            "discounts": [],
                            "discountAmount": 0,
                            "listPrice": 25,
                            "salePrice": 25,
                            "extendedListPrice": 25,
                            "extendedSalePrice": 25,
                            "extendedComparisonPrice": 25,
                            "categories": [],
                            "isShippingRequired": true,
                            "brand": "",
                            "addedByPromotion": true,
                            "couponAmount": 1,
                            "comparisonPrice": 1, 
                            "variantId": 74,
                            "socialMedia": [
                                {
                                    "channel": "Facebook",
                                    "code": "fb",
                                    "text": "I just bought '[Sample] Smith Journal 13' on HOME",
                                    "link": "http://www.facebook.com/sharer/sharer.php?p%5Burl%5D=https%3A%2F%2Fhome-v6.mybigcommerce.com%2Fsmith-journal-13%2F"
                                },
                                {
                                    "channel": "Twitter",
                                    "code": "tw",
                                    "text": "I just bought '[Sample] Smith Journal 13' on HOME",
                                    "link": "https://twitter.com/intent/tweet?url=https%3A%2F%2Fhome-v6.mybigcommerce.com%2Fsmith-journal-13%2F&text=I+just+bought+%27%5BSample%5D+Smith+Journal+13%27+on+HOME"
                                }
                            ],
                            "options": []
                        }
                    ],
                    "digitalItems": [],
                    "giftCertificates": []
                },
                "customerId": 0,
                "status": "AWAITING_FULFILLMENT",
                "customerCanBeCreated": true,
                "hasDigitalItems": false,
                "isDownloadable": true,
                "isComplete": true,
                "customerMessage": "",
                "taxes": [
                    {
                        "name": "Tax",
                        "amount": 0
                    }
                ],
                "taxTotal": 0,
                "consignments": [{
                    "shipping": [
                        {
                            "lineItems": [
                                {
                                    "id": 67
                                }
                            ],
                            "shippingAddressId": 52,
                            "firstName": "Jessica",
                            "lastName": "O Clark",
                            "company": "",
                            "address1": "4101 Hardesty Street",
                            "address2": "",
                            "city": "PITTSBURGH",
                            "stateOrProvince": "Pennsylvania",
                            "postalCode": "15230",
                            "country": "United States",
                            "countryCode": "US",
                            "email": "4yv64hceagn@temporary-mail.net",
                            "phone": "4127381855",
                            "itemsTotal": 1,
                            "itemsShipped": 0,
                            "shippingMethod": "Flat Rate",
                            "baseCost": 0.05,
                            "costExTax": 0.05,
                            "costIncTax": 0.05,
                            "costTax": 0,
                            "costTaxClassId": 2,
                            "baseHandlingCost": 0,
                            "handlingCostExTax": 0,
                            "handlingCostIncTax": 0,
                            "handlingCostTax": 0,
                            "handlingCostTaxClassId": 2,
                            "shippingZoneId": 1,
                            "shippingZoneName": "USA",
                            "customFields": []
                        }
                    ]
                }],
                "payments": [
                    {
                        "providerId": "bigpaypay",
                        "gatewayId": undefined,
                        "description": "Test Payment Provider",
                        "amount": 25.05,
                        "detail": {
                            "step": "FINALIZE",
                            "instructions": ""
                        }
                    }
                ],
                "billingAddress": {
                    "id": "",
                    "firstName": "Jessica",
                    "lastName": "O Clark",
                    "email": "4yv64hceagn@temporary-mail.net",
                    "company": "",
                    "address1": "4101 Hardesty Street",
                    "address2": "",
                    "city": "PITTSBURGH",
                    "stateOrProvince": "Pennsylvania",
                    "stateOrProvinceCode": "PA",
                    "country": "United States",
                    "countryCode": "US",
                    "postalCode": "15230",
                    "phone": "4127381855",
                    "customFields": []
                },
                "coupons": []
            };
            this.setState({ order, config });
            this.initialize(config);
            return;
        }

        loadOrder(orderId)
            .then(({ data }) => {
                const config = data.getConfig();
                this.initialize(config);
                // const { links: { siteLink = '' } = {} } = config || {};
                // const messenger = createEmbeddedMessenger({ parentOrigin: siteLink });

                // this.embeddedMessenger = messenger;

                // messenger.receiveStyles(styles => embeddedStylesheet.append(styles));
                // messenger.postFrameLoaded({ contentId: containerId });

                createStepTracker().trackOrderComplete();
            })
            .catch(this.handleUnhandledError);
    }

    private initialize(config: StoreConfig | undefined) {
        const {
            containerId,
            createEmbeddedMessenger,
            // createStepTracker,
            embeddedStylesheet,
        } = this.props;

        const { links: { siteLink = '' } = {} } = config || {};
        const messenger = createEmbeddedMessenger({ parentOrigin: siteLink });

        this.embeddedMessenger = messenger;

        messenger.receiveStyles(styles => embeddedStylesheet.append(styles));
        messenger.postFrameLoaded({ contentId: containerId });

        //createStepTracker().trackOrderComplete();
    }

    render(): ReactNode {
        let {
            order,
            config,
        } = this.props;

        const orderIdWAAVE = Number(window.localStorage.getItem('order_id'));
        if (orderIdWAAVE) {
            config = JSON.parse(window.localStorage.getItem('store_config') || '');
            order = this.state.order;
        }

        if (!order || !config) {
            return <LoadingSpinner isLoading={ true } />;
        }

        const paymentInstructions = getPaymentInstructions(order);
        const {
            storeProfile: {
                orderEmail,
                storePhoneNumber,
            },
            shopperConfig,
            links: {
                siteLink,
            },
        } = config;

        return (
            <div className={ classNames(
                'layout optimizedCheckout-contentPrimary',
                { 'is-embedded': isEmbedded() }
            ) }
            >
                <div className="layout-main">
                    <div className="orderConfirmation">
                        <ThankYouHeader name={ order.billingAddress.firstName } />

                        <OrderStatus
                            order={ order }
                            supportEmail={ orderEmail }
                            supportPhoneNumber={ storePhoneNumber }
                        />

                        { paymentInstructions && <OrderConfirmationSection>
                            <div
                                dangerouslySetInnerHTML={ {
                                    __html: DOMPurify.sanitize(paymentInstructions),
                                } }
                                data-test="payment-instructions"
                            />
                        </OrderConfirmationSection> }

                        { this.renderGuestSignUp({
                            shouldShowPasswordForm: order.customerCanBeCreated,
                            customerCanBeCreated: !order.customerId,
                            shopperConfig,
                        }) }

                        <div className="continueButtonContainer">
                            <a href={ siteLink } target="_top">
                                <Button variant={ ButtonVariant.Secondary }>
                                    <TranslatedString id="order_confirmation.continue_shopping" />
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>

                { this.renderOrderSummary() }
                { this.renderErrorModal() }
            </div>
        );
    }

    private renderGuestSignUp({ customerCanBeCreated, shouldShowPasswordForm, shopperConfig }: {
        customerCanBeCreated: boolean;
        shouldShowPasswordForm: boolean;
        shopperConfig: ShopperConfig;
    }): ReactNode {
        const {
            isSigningUp,
            hasSignedUp,
        } = this.state;

        const { order } = this.props;

        return <Fragment>
            { shouldShowPasswordForm && !hasSignedUp && <GuestSignUpForm
                customerCanBeCreated={ customerCanBeCreated }
                isSigningUp={ isSigningUp }
                onSignUp={ this.handleSignUp }
                passwordRequirements={ getPasswordRequirementsFromConfig(shopperConfig) }
            /> }

            { hasSignedUp && (order?.customerId ? <PasswordSavedSuccessAlert /> : <SignedUpSuccessAlert />) }
        </Fragment>;
    }

    private renderOrderSummary(): ReactNode {
        let data = this.props;
        const orderIdWAAVE = Number(window.localStorage.getItem('order_id'));
        if (orderIdWAAVE) {
            data = {...this.props, ...this.state }
        }

        const {
            order,
            config,
        } = data;

        if (!order || !config) {
            return null;
        }

        const {
            currency,
            shopperCurrency,
        } = config;

        return <>
            <MobileView>
                { matched => {
                    if (matched) {
                        return <LazyContainer>
                            <OrderSummaryDrawer
                                { ...mapToOrderSummarySubtotalsProps(order) }
                                headerLink={ <PrintLink className="modal-header-link cart-modal-link" /> }
                                lineItems={ order.lineItems }
                                shopperCurrency={ shopperCurrency }
                                storeCurrency={ currency }
                                total={ order.orderAmount }
                            />
                        </LazyContainer>;
                    }

                    return <aside className="layout-cart">
                        <LazyContainer>
                            <OrderSummary
                                headerLink={ <PrintLink /> }
                                { ...mapToOrderSummarySubtotalsProps(order) }
                                lineItems={ order.lineItems }
                                shopperCurrency={ shopperCurrency }
                                storeCurrency={ currency }
                                total={ order.orderAmount }
                            />
                        </LazyContainer>
                    </aside>;
                } }
            </MobileView>
        </>;
    }

    private renderErrorModal(): ReactNode {
        const { error } = this.state;

        return (
            <ErrorModal
                error={ error }
                onClose={ this.handleErrorModalClose }
                shouldShowErrorCode={ false }
            />
        );
    }

    private handleErrorModalClose: () => void = () => {
        this.setState({ error: undefined });
    };

    private handleSignUp: (values: SignUpFormValues) => void = ({ password, confirmPassword }) => {
        const { createAccount, config } = this.props;

        const shopperConfig = config && config.shopperConfig;
        const passwordRequirements = (shopperConfig &&
            shopperConfig.passwordRequirements &&
            shopperConfig.passwordRequirements.error) || '';

        this.setState({
            isSigningUp: true,
        });

        createAccount({
            password,
            confirmPassword,
        })
            .then(() => {
                this.setState({
                    hasSignedUp: true,
                    isSigningUp: false,
                });
            })
            .catch(error => {
                this.setState({
                    error: (error.status < 500) ?
                        new AccountCreationRequirementsError(error, passwordRequirements) :
                        new AccountCreationFailedError(error),
                    hasSignedUp: false,
                    isSigningUp: false,
                });
            });
    };

    private handleUnhandledError: (error: Error) => void = error => {
        const { errorLogger } = this.props;

        this.setState({ error });
        errorLogger.log(error);

        if (this.embeddedMessenger) {
            this.embeddedMessenger.postError(error);
        }
    };
}

// function loadOrderWAAVE(orderId: number): Promise<CheckoutSelectors> {
//     const baseUrl = 'https://staging-pg.getwaave.co';
//     //const baseUrl = 'https://pg.getwaave.co';

//     const storeHash = '';

//     const orderUrl = `${baseUrl}/bigcommerce/load-order?store_hash=${storeHash}&order_id=${orderId}`;
//     const response = fetch(orderUrl, {
//         credentials: 'omit',
//         headers: {
//             'Content-Type': 'application/json',
//             'Accept': 'application/json'
//         }
//     })
//     .then(response => response.json())
//     .then(result => result);

//     return Promise.all([
//         response
//     ]).then();
// }

// function getOrderWAAVE(orderId: number, storeHash: string): Promise<Order> {
//     const baseUrl = 'https://staging-pg.getwaave.co';
//     //const baseUrl = 'https://pg.getwaave.co';

//     const orderUrl = `${baseUrl}/bigcommerce/load-order?store_hash=${storeHash}&order_id=${orderId}`;
//     const response = fetch(orderUrl, {
//         credentials: 'omit',
//         headers: {
//             'Content-Type': 'application/json',
//             'Accept': 'application/json'
//         }
//     })
//     .then(response => response.json())
//     .then(result => result);

//     return Promise.all([response]).then();
// }

export function mapToOrderConfirmationProps(
    context: CheckoutContextProps
): WithCheckoutOrderConfirmationProps | null {
    const {
        checkoutState: {
            data: {
                getOrder,
                getConfig,
            },
            statuses: {
                isLoadingOrder,
            },
        },
        checkoutService,
    } = context;

    const config = getConfig();
    const order = getOrder();

    return {
        config,
        isLoadingOrder,
        loadOrder: checkoutService.loadOrder,
        order,
    };
}

export default withCheckout(mapToOrderConfirmationProps)(OrderConfirmation);
