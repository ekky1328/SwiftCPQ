export interface CoreSettings {
    prefix: string
    suffix: string
    logo: string
    currency: string
    timezone: string
    date_format: string
    contactInformationDefaults: ContactInformationDefaults
    proposalSettingsDefaults: ProposalSettingsDefaults
    theme: Theme
}

export interface ContactInformationDefaults {
    email: string
    phone: string
    address: Address
}

export interface Address {
    street: string
    city: string
    state: string
    postcode: string
    country: string
}

export interface ProposalSettingsDefaults {
    expiry: number
    tax: boolean
    taxRate: number
}

export interface Theme {
    primary: string
    secondary: string
    accent: string
}