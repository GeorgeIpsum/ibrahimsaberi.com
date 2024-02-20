-- CreateTable
CREATE TABLE "Author" (
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Category" (
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '000000',

    CONSTRAINT "Category_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Post" (
    "slug" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "PostContent" (
    "id" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "content" BYTEA,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCategory" (
    "postSlug" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_contentId_key" ON "Post"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_postSlug_categoryName_key" ON "PostCategory"("postSlug", "categoryName");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorUsername_fkey" FOREIGN KEY ("authorUsername") REFERENCES "Author"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "PostContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostContent" ADD CONSTRAINT "PostContent_slug_fkey" FOREIGN KEY ("slug") REFERENCES "Post"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postSlug_fkey" FOREIGN KEY ("postSlug") REFERENCES "Post"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "Category"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
