-- CreateTable
CREATE TABLE "webhook_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "webhook_key" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "sms_content" TEXT NOT NULL,
    "rec_time" TEXT,
    "received_at" BIGINT NOT NULL,
    CONSTRAINT "messages_username_fkey" FOREIGN KEY ("username") REFERENCES "webhook_users" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "card_keys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unused',
    "created_at" BIGINT NOT NULL,
    "used_at" BIGINT,
    CONSTRAINT "card_keys_username_fkey" FOREIGN KEY ("username") REFERENCES "webhook_users" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "description" TEXT,
    "order_num" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "rules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "card_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "app_name" TEXT NOT NULL,
    "phones" TEXT,
    "created_at" BIGINT NOT NULL,
    "first_used_at" BIGINT,
    "url" TEXT NOT NULL,
    "template_id" TEXT,
    CONSTRAINT "card_links_username_fkey" FOREIGN KEY ("username") REFERENCES "webhook_users" ("username") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "card_links_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_users_username_key" ON "webhook_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_users_webhook_key_key" ON "webhook_users"("webhook_key");

-- CreateIndex
CREATE UNIQUE INDEX "card_keys_key_key" ON "card_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "card_links_key_key" ON "card_links"("key");
