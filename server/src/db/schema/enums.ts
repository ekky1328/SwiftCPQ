import { pgEnum } from "drizzle-orm/pg-core";

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



