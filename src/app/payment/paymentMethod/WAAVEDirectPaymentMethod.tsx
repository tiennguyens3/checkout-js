import { CardInstrument, CheckoutSelectors, HostedFieldType, Instrument, PaymentInitializeOptions, PaymentInstrument, PaymentMethod, PaymentRequestOptions } from '@bigcommerce/checkout-sdk';
import { memoizeOne } from '@bigcommerce/memoize';
import { find, noop } from 'lodash';
import React, { Component, ReactNode } from 'react';
import { ObjectSchema } from 'yup';

import { withCheckout, CheckoutContextProps } from '../../checkout';
import { connectFormik, ConnectFormikProps } from '../../common/form';
import { MapToPropsFactory } from '../../common/hoc';
import { withLanguage, WithLanguageProps } from '../../locale';
import { withForm, WithFormProps } from '../../ui/form';
import { LoadingOverlay } from '../../ui/loading';
import { DocumentOnlyCustomFormFieldsetValues, FawryCustomFormFieldsetValues, IdealCustomFormFieldsetValues, SepaCustomFormFieldsetValues } from '../checkoutcomFieldsets/';
import { configureCardValidator, getCreditCardValidationSchema, CreditCardFieldset, CreditCardFieldsetValues } from '../creditCard';
import { HostedCreditCardFieldsetValues } from '../hostedCreditCard';
import { getInstrumentValidationSchema, isCardInstrument, isInstrumentCardCodeRequiredSelector, isInstrumentCardNumberRequiredSelector, isInstrumentFeatureAvailable, CardInstrumentFieldset, CardInstrumentFieldsetValues, CreditCardValidation } from '../storedInstrument';
import withPayment, { WithPaymentProps } from '../withPayment';
import { PaymentFormValues } from '../PaymentForm';
import StoreInstrumentFieldset from '../StoreInstrumentFieldset';

export interface WAAVEDirectPaymentMethodProps {
    isInitializing?: boolean;
    isUsingMultiShipping?: boolean;
    method: PaymentMethod;
    cardFieldset?: ReactNode;
    cardValidationSchema?: ObjectSchema<WAAVEDirectPaymentMethodValues>;
    storedCardValidationSchema?: ObjectSchema<WAAVEDirectPaymentMethodValues>;
    deinitializePayment(options: PaymentRequestOptions): Promise<CheckoutSelectors>;
    getStoredCardValidationFieldset?(selectedInstrument?: CardInstrument): ReactNode;
    initializePayment(options: PaymentInitializeOptions, selectedInstrument?: CardInstrument): Promise<CheckoutSelectors>;
    onUnhandledError?(error: Error): void;
}

export type WAAVEDirectPaymentMethodValues = CreditCardFieldsetValues | CardInstrumentFieldsetValues | HostedCreditCardFieldsetValues | DocumentOnlyCustomFormFieldsetValues | SepaCustomFormFieldsetValues | FawryCustomFormFieldsetValues | IdealCustomFormFieldsetValues;

interface WithCheckoutWAAVEDirectPaymentMethodProps {
    instruments: CardInstrument[];
    isCardCodeRequired: boolean;
    isCustomerCodeRequired: boolean;
    isInstrumentFeatureAvailable: boolean;
    isLoadingInstruments: boolean;
    isPaymentDataRequired: boolean;
    shouldShowInstrumentFieldset: boolean;
    isInstrumentCardCodeRequired(instrument: Instrument, method: PaymentMethod): boolean;
    isInstrumentCardNumberRequired(instrument: Instrument): boolean;
    loadInstruments(): Promise<CheckoutSelectors>;
}

interface WAAVEDirectPaymentMethodState {
    focusedHostedFieldType?: HostedFieldType;
    isAddingNewCard: boolean;
    selectedInstrumentId?: string;
}

class WAAVEDirectPaymentMethod extends Component<
    WAAVEDirectPaymentMethodProps &
        WithCheckoutWAAVEDirectPaymentMethodProps &
        WithFormProps &
        WithPaymentProps &
        WithLanguageProps &
        ConnectFormikProps<PaymentFormValues>,
    WAAVEDirectPaymentMethodState
> {
    state: WAAVEDirectPaymentMethodState = {
        isAddingNewCard: false,
    };

    async componentDidMount(): Promise<void> {
        const {
            isInstrumentFeatureAvailable: isInstrumentFeatureAvailableProp,
            loadInstruments,
            method,
            onUnhandledError = noop,
            setValidationSchema,
            setSubmit,
        } = this.props;

        setValidationSchema(method, this.getValidationSchema());
        configureCardValidator();
        setSubmit(method, this.createOrder);

        try {
            if (isInstrumentFeatureAvailableProp) {
                await loadInstruments();
            }

            console.log(method);
        } catch (error) {
            onUnhandledError(error);
        }
    }

    async componentWillUnmount(): Promise<void> {
        const {
            method,
            onUnhandledError = noop,
            setValidationSchema,
            setSubmit
        } = this.props;

        setValidationSchema(method, null);
        setSubmit(method, null);

        try {
            console.log(method);
        } catch (error) {
            onUnhandledError(error);
        }
    }

    async componentDidUpdate(_prevProps: Readonly<WAAVEDirectPaymentMethodProps>, prevState: Readonly<WAAVEDirectPaymentMethodState>): Promise<void> {
        const {
            method,
            onUnhandledError = noop,
            setValidationSchema,
        } = this.props;

        const {
            isAddingNewCard,
            selectedInstrumentId,
        } = this.state;

        setValidationSchema(method, this.getValidationSchema());

        if (selectedInstrumentId !== prevState.selectedInstrumentId ||
            isAddingNewCard !== prevState.isAddingNewCard) {
            try {
               console.log(method);
            } catch (error) {
                onUnhandledError(error);
            }
        }
    }

    render(): ReactNode {
        const {
            cardFieldset,
            getStoredCardValidationFieldset,
            instruments,
            isInitializing,
            isInstrumentCardCodeRequired: isInstrumentCardCodeRequiredProp,
            isInstrumentCardNumberRequired: isInstrumentCardNumberRequiredProp,
            isInstrumentFeatureAvailable: isInstrumentFeatureAvailableProp,
            isLoadingInstruments,
            shouldShowInstrumentFieldset,
            method,
        } = this.props;

        const { isAddingNewCard } = this.state;

        const selectedInstrument = this.getSelectedInstrument();
        const shouldShowCreditCardFieldset = !shouldShowInstrumentFieldset || isAddingNewCard;
        const isLoading = isInitializing || isLoadingInstruments;
        const shouldShowNumberField = selectedInstrument ? isInstrumentCardNumberRequiredProp(selectedInstrument) : false;
        const shouldShowCardCodeField = selectedInstrument ? isInstrumentCardCodeRequiredProp(selectedInstrument, method) : false;

        return (
            <LoadingOverlay
                hideContentWhenLoading
                isLoading={ isLoading }
            >
                <div className="paymentMethod paymentMethod--creditCard">
                    { shouldShowInstrumentFieldset && <CardInstrumentFieldset
                        instruments={ instruments }
                        onDeleteInstrument={ this.handleDeleteInstrument }
                        onSelectInstrument={ this.handleSelectInstrument }
                        onUseNewInstrument={ this.handleUseNewCard }
                        selectedInstrumentId={ selectedInstrument && selectedInstrument.bigpayToken }
                        validateInstrument={ getStoredCardValidationFieldset ?
                            getStoredCardValidationFieldset(selectedInstrument) :
                            <CreditCardValidation
                                shouldShowCardCodeField={ shouldShowCardCodeField }
                                shouldShowNumberField={ shouldShowNumberField }
                            /> }
                    /> }

                    { shouldShowCreditCardFieldset && !cardFieldset && <CreditCardFieldset
                        shouldShowCardCodeField={ method.config.cardCode || method.config.cardCode === null }
                        shouldShowCustomerCodeField={ method.config.requireCustomerCode }
                    /> }

                    { shouldShowCreditCardFieldset && cardFieldset }

                    { isInstrumentFeatureAvailableProp && <StoreInstrumentFieldset
                        instrumentId={ selectedInstrument && selectedInstrument.bigpayToken }
                    /> }
                </div>
            </LoadingOverlay>
        );
    }

    private createOrder() {
        console.log(this);
    }

    private getSelectedInstrument(): CardInstrument | undefined {
        const { instruments } = this.props;
        const { selectedInstrumentId = this.getDefaultInstrumentId() } = this.state;

        return find(instruments, { bigpayToken: selectedInstrumentId });
    }

    private getDefaultInstrumentId(): string | undefined {
        const { isAddingNewCard } = this.state;

        if (isAddingNewCard) {
            return;
        }

        const { instruments } = this.props;
        const defaultInstrument = (
            instruments.find(instrument => instrument.defaultInstrument) ||
            instruments[0]
        );

        return defaultInstrument && defaultInstrument.bigpayToken;
    }

    private getValidationSchema(): ObjectSchema<WAAVEDirectPaymentMethodValues> | null {
        const {
            cardValidationSchema,
            isInstrumentCardCodeRequired: isInstrumentCardCodeRequiredProp,
            isInstrumentCardNumberRequired: isInstrumentCardNumberRequiredProp,
            isInstrumentFeatureAvailable: isInstrumentFeatureAvailableProp,
            isPaymentDataRequired,
            language,
            method,
            storedCardValidationSchema,
        } = this.props;

        if (!isPaymentDataRequired) {
            return null;
        }

        const selectedInstrument = this.getSelectedInstrument();

        if (isInstrumentFeatureAvailableProp && selectedInstrument) {
            return storedCardValidationSchema || getInstrumentValidationSchema({
                instrumentBrand: selectedInstrument.brand,
                instrumentLast4: selectedInstrument.last4,
                isCardCodeRequired: isInstrumentCardCodeRequiredProp(selectedInstrument, method),
                isCardNumberRequired: isInstrumentCardNumberRequiredProp(selectedInstrument),
                language,
            });
        }

        return cardValidationSchema || getCreditCardValidationSchema({
            isCardCodeRequired: method.config.cardCode === true,
            language,
        });
    }

    private handleUseNewCard: () => void = () => {
        this.setState({
            isAddingNewCard: true,
            selectedInstrumentId: undefined,
        });
    };

    private handleSelectInstrument: (id: string) => void = id => {
        this.setState({
            isAddingNewCard: false,
            selectedInstrumentId: id,
        });
    };

    private handleDeleteInstrument: (id: string) => void = id => {
        const { instruments, formik: { setFieldValue } } = this.props;
        const { selectedInstrumentId } = this.state;

        if (instruments.length === 0) {
            this.setState({
                isAddingNewCard: true,
                selectedInstrumentId: undefined,
            });

            setFieldValue('instrumentId', '');
        } else if (selectedInstrumentId === id) {
            this.setState({
                selectedInstrumentId: this.getDefaultInstrumentId(),
            });

            setFieldValue('instrumentId', this.getDefaultInstrumentId());
        }
    };
}

const mapFromCheckoutProps: MapToPropsFactory<
    CheckoutContextProps,
    WithCheckoutWAAVEDirectPaymentMethodProps,
    WAAVEDirectPaymentMethodProps & ConnectFormikProps<PaymentFormValues>
> = () => {
    const filterInstruments = memoizeOne((instruments: PaymentInstrument[] = []) => instruments.filter(isCardInstrument));

    return (context, props) => {
        const {
            isUsingMultiShipping = false,
            method,
        } = props;

        const { checkoutService, checkoutState } = context;

        const {
            data: {
                getConfig,
                getCustomer,
                getInstruments,
                isPaymentDataRequired,
            },
            statuses: {
                isLoadingInstruments,
            },
        } = checkoutState;

        const config = getConfig();
        const customer = getCustomer();

        if (!config || !customer || !method) {
            return null;
        }

        const instruments = filterInstruments(getInstruments(method));
        const isInstrumentFeatureAvailableProp = isInstrumentFeatureAvailable({
            config,
            customer,
            isUsingMultiShipping,
            paymentMethod: method,
        });

        return {
            instruments,
            isCardCodeRequired: method.config.cardCode || method.config.cardCode === null,
            isCustomerCodeRequired: !!method.config.requireCustomerCode,
            isInstrumentCardCodeRequired: isInstrumentCardCodeRequiredSelector(checkoutState),
            isInstrumentCardNumberRequired: isInstrumentCardNumberRequiredSelector(checkoutState),
            isInstrumentFeatureAvailable: isInstrumentFeatureAvailableProp,
            isLoadingInstruments: isLoadingInstruments(),
            isPaymentDataRequired: isPaymentDataRequired(),
            loadInstruments: checkoutService.loadInstruments,
            shouldShowInstrumentFieldset: isInstrumentFeatureAvailableProp && instruments.length > 0,
        };
    };
};

export default connectFormik(withForm(withLanguage(withPayment(withCheckout(mapFromCheckoutProps)(WAAVEDirectPaymentMethod)))));
