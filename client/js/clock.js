import {Timer}  from "./timer.js";
import {Settings} from "./settings.js";

window.addEventListener("load", initialisePage);

function initialisePage() {
    new Clock();
}

class Clock {
    constructor() {
        this.initialise();

        this.timer = new Timer();
        this.settings = new Settings("settings");

        this.clock = document.getElementById("timer");
        this.timer.addEventListener("tick", this.update.bind(this));
    }

    initialise() {
        // add time zones
        const timezoneSelect = document.getElementById("setting.timezone");
        timezoneSelect.add(new Option("", undefined));
        for (const tz of Intl.supportedValuesOf("timeZone")) {
            timezoneSelect.add(new Option(tz, tz));
        }
    }

    draw() {
        const options = {
            timeStyle: this.settings.getValue("style") || "short",
            hour12: this.settings.getValue("hour12") ? this.settings.getValue("hour12") === "true" : undefined,
            timeZone: this.settings.getValue("timezone") || undefined,
        };

        this.clock.textContent = Intl.DateTimeFormat(undefined, options).format(new Date());
        return this;
    }

    update(event) {
        this.time = event.time;
        return this.draw();
    }
}
