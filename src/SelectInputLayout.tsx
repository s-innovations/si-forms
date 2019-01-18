import { KoLayout } from "si-kolayout";
import * as templateId from "template!./templates/SelectInputLayoutTemplate.html"

import "css!./content/SelectInputLayout.less";
import { observable, defaults, computed, subscribe } from "si-decorators";
import * as ko from "knockout";
import { FieldState } from "./InputLayout";


@defaults({ active: () => false, disabled: () => false, label: () => undefined, value: () => undefined }, true)
export class SelectInputValue {

    constructor(o) {}
    @observable disabled;
    @observable active;

    @observable value;
    @observable label;
}
export class SelectInputLayout extends KoLayout {

    constructor() {
        super({
            name: templateId
        });

        subscribe(() => this.fieldState.value, (value) => this.hasFocus = false)
    }

    toggleDropdown(m, e) {
        this.hasFocus = !this.hasFocus;
        if (this.hasFocus)
            this.openFocused = true;
    }

    @observable hasFocus = false;
    @observable searchText = "Search here..";
    @observable placeholder = "Search here..";
    @observable openFocused = false;
    @observable label = "label";
    items = ko.observableArray([]);

    selectValue(m, e) {
        
        this.items().forEach(i => i.active = false);
        m.active = true;
        this.fieldState.value = m.value;
        
    }

    fieldState = new FieldState<string>();
     
    
}

export default SelectInputLayout;