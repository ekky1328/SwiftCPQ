import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Tenant Enum
 */
export const tenantStatus = pgEnum("tenant_status", [
    "PENDING",
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED"
]);

/**
 * User Enums
 */
export const userStatus = pgEnum("user_status", [
    "ACTIVE",
    "INACTIVE"
]);


/**
 * Proposal Enums
 */
export const proposalStatus = pgEnum("proposal_status", [
    "DRAFT",
    "IN_REVIEW",
    "REQUIRES_REVISION", 
    "SENT", 
    "VIEWED",
    "APPROVED",
    "DECLINED",
    "EXPIRED",
    "CANCELED"
]);
  

export const sectionType = pgEnum("section_type", [
    "COVER_LETTER",
    "PRODUCTS",
    "INFO",
    "TOTALS",
    "MILESTONES",
    "TERMS_AND_CONDITIONS",
]);
  

export const sectionRecurrance = pgEnum("section_recurrance", [
    "ONE_TIME",
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "ANNUAL",
]);

export const itemType = pgEnum("item_type", [
    "PRODUCT",
    "BUNDLE",
    "COMMENT",
]);



