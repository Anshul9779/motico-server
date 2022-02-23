/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `PhoneNumber` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_number_key" ON "PhoneNumber"("number");
