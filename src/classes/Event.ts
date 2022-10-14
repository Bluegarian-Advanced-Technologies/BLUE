import { ClientEvents } from "discord.js";
import Client from "./Client";

interface EventOptions<T extends keyof ClientEvents> {
    id: string;
    once: boolean;
    eventType: T;
    disableExempted?: boolean;
}

class Event<T extends keyof ClientEvents> {
    id: string;
    once: boolean;
    eventType: T;
    disableExempted: boolean;

    execute: (client: Client, ...eventData: ClientEvents[T]) => Promise<unknown>;

    constructor(options: EventOptions<T>, execute: (client: Client, ...eventData: ClientEvents[T]) => Promise<unknown>) {
        this.id = options.id;
        this.once = options.once;
        this.eventType = options.eventType;
        this.disableExempted = options.disableExempted ?? false;
        this.execute = execute;
    }
}

export default Event;
