/*
  Warnings:

  - Added the required column `blurb` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "blurb" TEXT NOT NULL,
ADD COLUMN     "meta" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "title" TEXT NOT NULL;
