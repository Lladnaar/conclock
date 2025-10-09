export class Timer extends EventTarget {
    constructor() {
        super();

        // restore cached offset
        this.timer = setInterval(this.doTick.bind(this), 500);
		
        this.fetchTime();
    }

    setTime(time) {
        return this.setOffset(time - Date.now());
    }

    getTime() {
        return new Date(Date.now() + this.offset);
    }

    setOffset(offset) {
        this.offset = offset;
        localStorage.setItem("timer.offset", offset);
        console.debug("Timer offset set to", offset);
        return this.doTick();
    }

    doTick() {
        const event = new Event("tick");
        event.time = this.getTime();
        return this.dispatchEvent(event);
    }

    fetchTime() {
        fetch("/api/time")
            .then(response => {
                return response.json();
            })
            .then(json => {
                this.setTime(new Date(json.time));
            })
            .catch(error => {
                console.error("Failed to fetch time from server:", error);
            });
    }
}
