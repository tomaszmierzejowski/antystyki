using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UsageStatistics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_name = 'ga_statistics'
                    ) THEN
                        EXECUTE 'ALTER TABLE "ga_statistics" DROP CONSTRAINT IF EXISTS "FK_ga_statistics_AspNetUsers_CreatedByUserId"';
                        EXECUTE 'ALTER TABLE "ga_statistics" DROP CONSTRAINT IF EXISTS "FK_ga_statistics_AspNetUsers_ModeratedByUserId"';
                        EXECUTE 'ALTER TABLE "ga_statistics" DROP COLUMN IF EXISTS "CreatedByUserId"';
                        EXECUTE 'ALTER TABLE "ga_statistics" DROP COLUMN IF EXISTS "ModeratedByUserId"';
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_name = 'ga_statistics'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_schema = 'public'
                              AND table_name = 'ga_statistics'
                              AND column_name = 'CreatedByUserId'
                        ) THEN
                            EXECUTE 'ALTER TABLE "ga_statistics" ADD COLUMN "CreatedByUserId" uuid NULL';
                        END IF;

                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_schema = 'public'
                              AND table_name = 'ga_statistics'
                              AND column_name = 'ModeratedByUserId'
                        ) THEN
                            EXECUTE 'ALTER TABLE "ga_statistics" ADD COLUMN "ModeratedByUserId" uuid NULL';
                        END IF;

                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.constraint_column_usage
                            WHERE table_schema = 'public'
                              AND table_name = 'ga_statistics'
                              AND constraint_name = 'FK_ga_statistics_AspNetUsers_CreatedByUserId'
                        ) THEN
                            EXECUTE 'ALTER TABLE "ga_statistics" ADD CONSTRAINT "FK_ga_statistics_AspNetUsers_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "AspNetUsers" ("Id") ON DELETE NO ACTION';
                        END IF;

                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.constraint_column_usage
                            WHERE table_schema = 'public'
                              AND table_name = 'ga_statistics'
                              AND constraint_name = 'FK_ga_statistics_AspNetUsers_ModeratedByUserId'
                        ) THEN
                            EXECUTE 'ALTER TABLE "ga_statistics" ADD CONSTRAINT "FK_ga_statistics_AspNetUsers_ModeratedByUserId" FOREIGN KEY ("ModeratedByUserId") REFERENCES "AspNetUsers" ("Id") ON DELETE NO ACTION';
                        END IF;
                    END IF;
                END $$;
                """);
        }
    }
}
