CREATE TABLE "user_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_validated" timestamp with time zone,
	"validation_status" varchar(20) DEFAULT 'pending',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_custom_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model_id" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"max_tokens" bigint DEFAULT 4096,
	"supports_vision" boolean DEFAULT false,
	"supports_tools" boolean DEFAULT false,
	"supports_audio" boolean DEFAULT false,
	"supports_video" boolean DEFAULT false,
	"supports_document" boolean DEFAULT false,
	"cost_per_1k_input_tokens" numeric(10, 6) DEFAULT '0',
	"cost_per_1k_output_tokens" numeric(10, 6) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_provider_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"default_model" varchar(100),
	"settings" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_custom_models" ADD CONSTRAINT "user_custom_models_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_provider_preferences" ADD CONSTRAINT "user_provider_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_api_keys_user_id_idx" ON "user_api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_api_keys_provider_idx" ON "user_api_keys" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "user_api_keys_user_provider_idx" ON "user_api_keys" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "user_custom_models_user_id_idx" ON "user_custom_models" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_custom_models_provider_idx" ON "user_custom_models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "user_custom_models_user_provider_idx" ON "user_custom_models" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "user_custom_models_model_id_idx" ON "user_custom_models" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "user_provider_preferences_user_id_idx" ON "user_provider_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_provider_preferences_provider_idx" ON "user_provider_preferences" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "user_provider_preferences_user_provider_idx" ON "user_provider_preferences" USING btree ("user_id","provider");