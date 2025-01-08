import { Address } from "./System"

export interface Customer {
    name: string
    contact: Contact
    email: string
    phone: string
    address: Address
}

export interface Contact {
    firstName: string
    lastName: string
}