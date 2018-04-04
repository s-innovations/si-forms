
import { KnockoutJsxFactory, valueBinding, ValueUpdate, ValueAllowUnset, Binding, JSXLayout } from "si-kolayout-jsx"

 
import { observable, subscribe, Observable, subscribeOnce, defaults } from "si-decorators";
import * as ko from "knockout";
import "css!./content/FormImput.less";

export interface InputAttributes<T> {
    label: string;
    value?: T;
    key?: string;
    name?: string;
    spellcheck?: boolean;
    autoComplete?: string;
    type?: "number" | "text" | "password" | "email";
}
export interface InputAttributeInternal {
    type: "number" | "text" | "password" | "email";
}

export interface IFieldState<T> {
    hasValue: boolean;
    hasError: boolean;
    hasSuccess: boolean;

}

function isDefined(obj: any) {
    return !(typeof obj === "undefined" || obj === null);
}


export interface InputTemplateViewModel<T> {
    //  value: T | KnockoutObservable<T>;
    fieldState: IFieldState<T>;
    hasFocus: boolean;
}

const InputTemplate = <T extends InputTemplateViewModel<T1>, T1 extends number | string>(attributes: InputAttributes<T1> & InputAttributeInternal) => (
    <div class="md-form-group md-label-floating" data-bind="css:{'is-focused':hasFocus, 'has-value': fieldState.hasValue, 'has-error':fieldState.hasError, 'has-success':fieldState.hasSuccess}">
        <input id={attributes.key} type={attributes.type} class="md-form-control" autoComplete="{attributes.autoComplete}"
spellCheck={ attributes.spellcheck }
name={ attributes.name || attributes.key }
data-bind="value:fieldState.value, hasfocus: hasFocus, valueUpdate: valueUpdate" />
    <label class="md-control-label" for={ attributes.key } > { attributes.label } </label>
        <ko if="fieldState.hasError" >
            <span id={ attributes.key + '-error' } class="has-error md-help-block" data-bind="text:fieldState.error" > </span>
        </ko>
    </div>
);



/**
 * Runs the value through a list of validators. As soon as a validation error is detected, the error is returned
 */
export function applyValidators<TValue>(value: TValue, validators: Validator<TValue>[]): Promise<string | null | undefined> {
    return new Promise<string | null | undefined>(resolve => {
        let currentIndex = 0;

        let gotoNextValidator = () => {
            currentIndex++;
            runCurrentValidator();
        }

        let runCurrentValidator = () => {
            if (currentIndex == validators.length) {
                resolve(null);
                return;
            }
            let validator = validators[currentIndex];
            let res: any = validator(value);

            // no error
            if (!res) {
                gotoNextValidator();
                return;
            }

            // some error
            if (!res.then) {
                resolve(res);
                return;
            }

            // wait for error response
            res.then((msg: any) => {
                if (!msg) gotoNextValidator();
                else resolve(msg);
            })
        }

        // kickoff
        runCurrentValidator();
    });
}

/** A truthy string or falsy values */
export type ValidationResponse =
    string
    | null
    | undefined
    | false

/**
 * A validator simply takes a value and returns a string or Promise<string>
 * If a truthy string is returned it represents a validation error
 **/
export interface Validator<TValue> {
    (value: TValue): ValidationResponse | Promise<ValidationResponse>;
}


export class FieldState<TValue>{

    /**
    * The value you should bind to the input in your field.
    */
    @observable value: TValue;

    /** If there is any error on the field on last validation attempt */
    @observable error?: string;// = "Please enter a valid email address.";

    /**
   * Set to true if a validation run has been completed since init
   * Use case:
   * - to show a green color in the field if `hasError` is false
   **/
    @observable hasBeenValidated: boolean = false;

    @observable canValidate = true;


    get hasValue() {
        return isDefined(this.value);
    }

    get hasError() {
        return !!this.error;
    }

    get hasSuccess() {
        return !this.hasError && this.hasBeenValidated;
    }

    @observable validating: boolean = false;


    @observable
    protected _validators: Validator<TValue>[] = [];

    validators(...validators: Validator<TValue>[]): this {
        this._validators = validators;
        return this;
    }

    lastValidationRequest = 0;

    constructor() {

        ko.computed(() => {
            let value = this.value;




            if (this.canValidate && !ko.computedContext.isInitial()) {

                let validators = this._validators;
                const lastValidationRequest = ++this.lastValidationRequest;

                this.validating = true;
                const value = this.value;


                return applyValidators(value, validators).then(fieldError => {


                    if (this.lastValidationRequest !== lastValidationRequest) {
                        if (this.hasError) {
                            return { hasError: true };
                        }
                        else {
                            return {
                                hasError: false,
                                value: value,
                            };
                        }
                    }

                    this.validating = false;
                    this.hasBeenValidated = true;

                    /** For any change in field error, update our error */
                    if (fieldError != this.error) {
                        this.error = fieldError;
                    }

                    /** Check for error */
                    const hasError = this.hasError;


                    /** return a result based on error status */
                    if (hasError) {
                        return { hasError };
                    }
                    else {
                        return {
                            hasError,
                            value
                        };
                    }

                });


            }

        }).extend({ rateLimit: 100 });
    }
}





@defaults({ key: (o) => o.name })
export class InputLayout<T extends number | string> extends JSXLayout<InputAttributes<T>> {

    fieldState = new FieldState<T>();
    valueUpdate = "input";

    @observable hasFocus = false;


    constructor(attributes: InputAttributes<T> & InputAttributeInternal) {
        super(attributes, InputTemplate<this, T>(attributes));
        console.log(attributes);
        // this.value = attributes.value;

        subscribe(() => this.fieldState.value, v => {
            console.log(v);
        });




    }

    withKeyupValueUpdate() {
        this.valueUpdate = "keyup";

        this.fieldState.canValidate = false;
        subscribeOnce(() => this.hasFocus, (focus) => this.fieldState.canValidate = this.fieldState.canValidate || !focus);

    }


}