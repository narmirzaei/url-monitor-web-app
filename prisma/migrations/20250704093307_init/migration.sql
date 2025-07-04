-- CreateTable
CREATE TABLE "monitored_urls" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "check_interval" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_check" TIMESTAMP(3),
    "last_content_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitored_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "url_checks" (
    "id" SERIAL NOT NULL,
    "url_id" INTEGER NOT NULL,
    "content_hash" TEXT NOT NULL,
    "content_preview" TEXT,
    "changes_detected" BOOLEAN NOT NULL DEFAULT false,
    "check_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_message" TEXT,

    CONSTRAINT "url_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "url_id" INTEGER NOT NULL,
    "check_id" INTEGER NOT NULL,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMP(3),
    "changes_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "url_checks" ADD CONSTRAINT "url_checks_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "monitored_urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "monitored_urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "url_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
