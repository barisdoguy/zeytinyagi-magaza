CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`user_email` text DEFAULT '' NOT NULL,
	`action` text NOT NULL,
	`entity` text DEFAULT '' NOT NULL,
	`entity_id` text DEFAULT '' NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`handled` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`min_subtotal_kurus` integer DEFAULT 0 NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`max_uses` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_attempts_key_idx` ON `login_attempts` (`key`,`created_at`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`variant_id` integer,
	`product_name` text NOT NULL,
	`variant_label` text NOT NULL,
	`unit_price_kurus` integer NOT NULL,
	`quantity` integer NOT NULL,
	`line_total_kurus` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`access_token` text NOT NULL,
	`status` text DEFAULT 'pending_payment' NOT NULL,
	`customer_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`district` text NOT NULL,
	`address_line` text NOT NULL,
	`postal_code` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`subtotal_kurus` integer NOT NULL,
	`discount_kurus` integer DEFAULT 0 NOT NULL,
	`shipping_kurus` integer NOT NULL,
	`total_kurus` integer NOT NULL,
	`coupon_code` text,
	`payment_provider` text NOT NULL,
	`payment_ref` text,
	`stock_committed` integer DEFAULT false NOT NULL,
	`carrier` text DEFAULT '' NOT NULL,
	`tracking_number` text DEFAULT '' NOT NULL,
	`customer_ip` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`paid_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_unique` ON `orders` (`number`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `pages` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`event_id` text NOT NULL,
	`order_number` text NOT NULL,
	`outcome` text NOT NULL,
	`result` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_events_unique` ON `payment_events` (`provider`,`event_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`features` text DEFAULT '' NOT NULL,
	`image_file` text,
	`image_alt` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`label` text NOT NULL,
	`volume_ml` integer,
	`packaging` text DEFAULT '' NOT NULL,
	`sku` text DEFAULT '' NOT NULL,
	`price_kurus` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `variants_product_idx` ON `variants` (`product_id`);