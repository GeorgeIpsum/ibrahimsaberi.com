/*
  Warnings:

  - You are about to drop the column `contentId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `PostContent` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_contentId_fkey";

-- DropForeignKey
ALTER TABLE "PostContent" DROP CONSTRAINT "PostContent_slug_fkey";

-- DropIndex
DROP INDEX "Post_contentId_key";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "contentId",
ADD COLUMN     "content" BYTEA NOT NULL;

-- DropTable
DROP TABLE "PostContent";

-- CreateTable
CREATE TABLE "PostHistory" (
    "id" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "content" BYTEA,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PostHistory" ADD CONSTRAINT "PostHistory_slug_fkey" FOREIGN KEY ("slug") REFERENCES "Post"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
