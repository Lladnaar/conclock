export class Settings {
    constructor(id = "settings") {
        this.elements = new Map();

        this.panel = document.getElementById(id);
        this.panel.hidden = true;
        this.addAllElements(this.panel);

        document.addEventListener("keydown", this.keyDown.bind(this));
        document.addEventListener("mousedown", this.mouseDown.bind(this));
        this.getElement("close").addEventListener("click", this.toggle.bind(this));
    }

    addAllElements(element) {
        if (element.id.substring(0, 8) == "setting.")
            this.addElement(element, element.id.substring(8));
        for (const child of element.children)
            this.addAllElements(child);
        return this;
    }

    addElement(element, setting = element.id) {
        this.elements.set(setting, element);
        element.value = localStorage.getItem(element.id) || element.value;
        element.addEventListener("change", () => {
            localStorage.setItem(element.id, element.value);
        });
        return this;
    }

    getValue(setting) {
        return this.elements.get(setting).value;
    }

    getElement(setting) {
        return this.elements.get(setting);
    }

    setValue(setting, value) {
        const element = this.elements.get(setting);
        if (element)
            element.value = value;
        return this;
    }

    addEventListener(setting, callback) {
        const element = this.elements.get(setting);
        if (element)
            element.addEventListener("change", callback);
        return this;
    }

    keyDown(event) {
        if (event.key == "Escape") {
            this.toggle();
            event.stopPropagation();
        }
        return this;
    }

    mouseDown(event) {
        if (event.button === 1) {
            this.toggle();
            event.stopPropagation();
        }
        return this;
    }

    toggle() {
        document.activeElement.blur();
        this.panel.hidden = !this.panel.hidden;
        return this;
    }
}
