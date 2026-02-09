export interface Channel {
    name: string;
    url: string;
    group?: string;
    logo?: string;
    id?: string;
}

export interface Category {
    name: string;
    channels: Channel[];
}
