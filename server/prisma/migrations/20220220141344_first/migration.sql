-- CreateEnum
CREATE TYPE "PhoneNumberDocumentStatus" AS ENUM ('UPLOADED', 'VERIFIED', 'PENDING', 'NOT_UPLOADED');

-- CreateEnum
CREATE TYPE "SettingsStatus" AS ENUM ('DISABLED', 'TEXT', 'AUDIO');

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('INCOMING', 'OUTGOING', 'MISSED');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('ONGOING', 'ENDED', 'DROPPED');

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "personalNumber" TEXT,
    "roles" TEXT[],
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "recieveUpdates" BOOLEAN NOT NULL DEFAULT false,
    "missedCallAlert" BOOLEAN NOT NULL DEFAULT false,
    "voicemailAlert" BOOLEAN NOT NULL DEFAULT false,
    "showDashboard" BOOLEAN NOT NULL DEFAULT false,
    "showDialler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cost" DECIMAL(65,30) NOT NULL,
    "number" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "purchasedOn" TIMESTAMP(3) NOT NULL,
    "twillioId" TEXT NOT NULL,
    "userIds" INTEGER[],
    "teamId" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumberSettings" (
    "id" SERIAL NOT NULL,
    "phoneNumberId" INTEGER NOT NULL,
    "allowRecord" BOOLEAN NOT NULL DEFAULT false,
    "allowPause" BOOLEAN NOT NULL DEFAULT false,
    "documentStatus" "PhoneNumberDocumentStatus" NOT NULL,
    "greetingMsgStatus" "SettingsStatus" NOT NULL,
    "greetingMsgText" TEXT NOT NULL DEFAULT E'',
    "greetingMsgAudio" TEXT NOT NULL DEFAULT E'',
    "voicemailStatus" "SettingsStatus" NOT NULL,
    "voicemailText" TEXT NOT NULL DEFAULT E'',
    "voicemailAudio" TEXT NOT NULL DEFAULT E'',
    "ivrEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ivrMessage" TEXT NOT NULL DEFAULT E'',
    "ivrDataTeamIds" INTEGER[],
    "ivrData" JSONB NOT NULL,

    CONSTRAINT "PhoneNumberSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" SERIAL NOT NULL,
    "fromId" INTEGER NOT NULL,
    "to" TEXT NOT NULL,
    "sid" TEXT NOT NULL DEFAULT E'',
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "startedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedOn" TIMESTAMP(3),
    "status" "CallStatus" NOT NULL,
    "type" "CallType" NOT NULL,
    "recordedURL" TEXT,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PhoneNumberToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_settingsId_key" ON "User"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_teamId_key" ON "PhoneNumber"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumberSettings_phoneNumberId_key" ON "PhoneNumberSettings"("phoneNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "_PhoneNumberToUser_AB_unique" ON "_PhoneNumberToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_PhoneNumberToUser_B_index" ON "_PhoneNumberToUser"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumberSettings" ADD CONSTRAINT "PhoneNumberSettings_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "PhoneNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhoneNumberToUser" ADD FOREIGN KEY ("A") REFERENCES "PhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhoneNumberToUser" ADD FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
