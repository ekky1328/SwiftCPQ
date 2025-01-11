CREATE TYPE "public"."item_type" AS ENUM('PRODUCT', 'BUNDLE', 'COMMENT');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('DRAFT', 'IN_REVIEW', 'REQUIRES_REVISION', 'SENT', 'VIEWED', 'APPROVED', 'DECLINED', 'EXPIRED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."section_recurrance" AS ENUM('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL');--> statement-breakpoint
CREATE TYPE "public"."section_type" AS ENUM('COVER_LETTER', 'PRODUCTS', 'INFO', 'TOTALS', 'MILESTONES', 'TERMS_AND_CONDITIONS');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "customer_contact" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"role" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"primary_contact_id" integer NOT NULL,
	"primary_location_id" integer NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "customer_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customer_location" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_section_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"section_id" integer,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"order" numeric NOT NULL,
	"qty" numeric DEFAULT '0' NOT NULL,
	"cost" numeric(2, 100) NOT NULL,
	"price" numeric(2, 100) NOT NULL,
	"margin" numeric(2, 100) NOT NULL,
	"subtotal" numeric(2, 100) NOT NULL,
	"sku" varchar(256) NOT NULL,
	"type" "item_type" DEFAULT 'PRODUCT' NOT NULL,
	"is_optional" boolean DEFAULT false,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_section_item_order_unique" UNIQUE("order")
);
--> statement-breakpoint
CREATE TABLE "proposal_section_milestone" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"section_id" integer,
	"title" varchar(255),
	"description" text DEFAULT '' NOT NULL,
	"order" numeric NOT NULL,
	"due_date" date,
	"amount" numeric(2, 100) NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_section_milestone_order_unique" UNIQUE("order")
);
--> statement-breakpoint
CREATE TABLE "proposal" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"version" numeric NOT NULL,
	"identifier" varchar(5) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" "proposal_status" DEFAULT 'DRAFT' NOT NULL,
	"user_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_section" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"proposal_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "section_type" NOT NULL,
	"order" numeric NOT NULL,
	"recurrance" "section_recurrance",
	"description" text DEFAULT '' NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_reference" boolean DEFAULT false NOT NULL,
	"block_removal" boolean DEFAULT false NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_section_order_unique" UNIQUE("order")
);
--> statement-breakpoint
CREATE TABLE "tenant_permission" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255) DEFAULT '' NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_role_permission" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_role_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"prefix" varchar(50) DEFAULT 'S-CPQ' NOT NULL,
	"suffix" varchar(50) DEFAULT '' NOT NULL,
	"logo" varchar(255) DEFAULT 'default.svg' NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"date_format" varchar(20) DEFAULT 'YYYY-MM-DD' NOT NULL,
	"contact_information" integer NOT NULL,
	"proposal_settings" integer NOT NULL,
	"proposal_settings_default" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(255),
	"admin_user_id" integer NOT NULL,
	"status" "tenant_status" DEFAULT 'ACTIVE' NOT NULL,
	"status_reason" text DEFAULT '' NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "tenant_address_information" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_contact_information" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"address" integer NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_proposal_setting" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"expiry" numeric DEFAULT '14' NOT NULL,
	"tax" boolean DEFAULT true NOT NULL,
	"tax_rate" numeric DEFAULT '10' NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_theme" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"primary" varchar DEFAULT '#ff822d' NOT NULL,
	"secondary" varchar DEFAULT '#2D7FFF' NOT NULL,
	"accent" varchar DEFAULT '#CC681F' NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"description" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isSuperAdmin" boolean DEFAULT false NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_contact" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_location" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_location_id_customer_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."customer_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_location" ADD CONSTRAINT "customer_location_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_location" ADD CONSTRAINT "customer_location_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_section_item" ADD CONSTRAINT "proposal_section_item_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_section_item" ADD CONSTRAINT "proposal_section_item_section_id_proposal_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."proposal_section"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_section_milestone" ADD CONSTRAINT "proposal_section_milestone_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_section_milestone" ADD CONSTRAINT "proposal_section_milestone_section_id_proposal_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."proposal_section"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_section" ADD CONSTRAINT "proposal_section_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_section" ADD CONSTRAINT "proposal_section_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_permission" ADD CONSTRAINT "tenant_permission_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role" ADD CONSTRAINT "tenant_role_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_permission" ADD CONSTRAINT "tenant_role_permission_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_permission" ADD CONSTRAINT "tenant_role_permission_role_id_tenant_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."tenant_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_permission" ADD CONSTRAINT "tenant_role_permission_permission_id_tenant_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."tenant_permission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_user" ADD CONSTRAINT "tenant_role_user_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_user" ADD CONSTRAINT "tenant_role_user_role_id_tenant_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."tenant_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_user" ADD CONSTRAINT "tenant_role_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_contact_information_tenant_contact_information_id_fk" FOREIGN KEY ("contact_information") REFERENCES "public"."tenant_contact_information"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_proposal_settings_tenant_proposal_setting_id_fk" FOREIGN KEY ("proposal_settings") REFERENCES "public"."tenant_proposal_setting"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_proposal_settings_default_tenant_theme_id_fk" FOREIGN KEY ("proposal_settings_default") REFERENCES "public"."tenant_theme"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_address_information" ADD CONSTRAINT "tenant_address_information_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_contact_information" ADD CONSTRAINT "tenant_contact_information_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_contact_information" ADD CONSTRAINT "tenant_contact_information_address_tenant_address_information_id_fk" FOREIGN KEY ("address") REFERENCES "public"."tenant_address_information"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_proposal_setting" ADD CONSTRAINT "tenant_proposal_setting_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_theme" ADD CONSTRAINT "tenant_theme_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contact" ADD CONSTRAINT "user_contact_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_location" ADD CONSTRAINT "user_location_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;