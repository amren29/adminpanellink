export interface Address {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface Customer {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    shippingAddress: Address;
    billingAddress: Address;
    companyName?: string; // B2B
    taxId?: string; // B2B - Tax / SST ID
    marketingOptIn: boolean;
    accountCreatedDate: string;
    avatar?: string;
}

export const emptyAddress: Address = {
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
};

export const emptyCustomer: Omit<Customer, "id" | "accountCreatedDate"> = {
    fullName: "",
    email: "",
    phone: "",
    shippingAddress: { ...emptyAddress },
    billingAddress: { ...emptyAddress },
    companyName: "",
    taxId: "",
    marketingOptIn: false,
};

export const sampleCustomers: Customer[] = [];

export const formatAddress = (address: Address): string => {
    const parts = [
        address.street,
        address.city,
        address.state,
        address.zip,
        address.country,
    ].filter(Boolean);
    return parts.join(", ");
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
