CREATE TYPE "public"."item_type" AS ENUM('PRODUCT', 'BUNDLE', 'COMMENT');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('DRAFT', 'IN_REVIEW', 'REQUIRES_REVISION', 'SENT', 'VIEWED', 'APPROVED', 'DECLINED', 'EXPIRED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."section_recurrance" AS ENUM('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL');--> statement-breakpoint
CREATE TYPE "public"."section_type" AS ENUM('COVER_LETTER', 'PRODUCTS', 'INFO', 'TOTALS', 'MILESTONES', 'TERMS_AND_CONDITIONS');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"tenant_id" uuid NOT NULL,
	"primary_customer_contact_id" uuid,
	"primary_customer_location_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "customer_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customer_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"role" varchar(255) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"location_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_section_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order" integer NOT NULL,
	"sku" varchar(256),
	"title" varchar(255) DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"qty" integer DEFAULT 0 NOT NULL,
	"cost" integer NOT NULL,
	"price" integer NOT NULL,
	"margin" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"type" "item_type" DEFAULT 'PRODUCT' NOT NULL,
	"is_optional" boolean DEFAULT false,
	"tenant_id" uuid NOT NULL,
	"section_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_section_milestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255),
	"description" text DEFAULT '' NOT NULL,
	"order" integer NOT NULL,
	"due_date" date,
	"amount" integer NOT NULL,
	"tenant_id" uuid NOT NULL,
	"section_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"identifier" varchar(5) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" "proposal_status" DEFAULT 'DRAFT' NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"customer_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "section_type" NOT NULL,
	"order" integer NOT NULL,
	"recurrance" "section_recurrance",
	"description" text DEFAULT '' NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_reference" boolean DEFAULT false NOT NULL,
	"block_removal" boolean DEFAULT false NOT NULL,
	"tenant_id" uuid NOT NULL,
	"proposal_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255) DEFAULT '' NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_role_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_role_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prefix" varchar(50) DEFAULT 'S-CPQ' NOT NULL,
	"suffix" varchar(50) DEFAULT '' NOT NULL,
	"logo" varchar(255) DEFAULT 'default.svg' NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"date_format" varchar(20) DEFAULT 'YYYY-MM-DD' NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contact_information" uuid,
	"proposal_settings" uuid,
	"proposal_settings_default" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(255),
	"status" "tenant_status" DEFAULT 'PENDING' NOT NULL,
	"status_reason" text DEFAULT '' NOT NULL,
	"admin_user_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "tenant_address_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_contact_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"tenant_id" uuid NOT NULL,
	"address" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_proposal_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expiry" integer DEFAULT 14 NOT NULL,
	"tax" boolean DEFAULT true NOT NULL,
	"tax_rate" integer DEFAULT 10 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_theme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary" varchar DEFAULT '#ff822d' NOT NULL,
	"secondary" varchar DEFAULT '#2D7FFF' NOT NULL,
	"accent" varchar DEFAULT '#CC681F' NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"description" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isSuperAdmin" boolean DEFAULT false NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_location" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"created_on_date" timestamp (3) DEFAULT now() NOT NULL,
	"modified_on_date" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_location_id_customer_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."customer_location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "tenant_role_permission" ADD CONSTRAINT "tenant_role_permission_role_id_tenant_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."tenant_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_permission" ADD CONSTRAINT "tenant_role_permission_permission_id_tenant_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."tenant_permission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_permission" ADD CONSTRAINT "tenant_role_permission_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_user" ADD CONSTRAINT "tenant_role_user_role_id_tenant_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."tenant_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_user" ADD CONSTRAINT "tenant_role_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_user" ADD CONSTRAINT "tenant_role_user_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "user_contact" ADD CONSTRAINT "user_contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_location" ADD CONSTRAINT "user_location_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_location" ADD CONSTRAINT "user_location_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;