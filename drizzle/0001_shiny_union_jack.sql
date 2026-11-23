CREATE TABLE `booking_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentUserId` int NOT NULL,
	`studentProfileId` int,
	`teacherProfileId` int NOT NULL,
	`subject` varchar(100) NOT NULL,
	`curriculum` varchar(120) NOT NULL,
	`grade` varchar(40) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`durationMinutes` int NOT NULL,
	`status` enum('requested','confirmed','cancelled','completed') NOT NULL DEFAULT 'requested',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingRequestId` int NOT NULL,
	`studentProfileId` int,
	`teacherUserId` int NOT NULL,
	`attended` boolean NOT NULL,
	`summary` text NOT NULL,
	`strengths` text,
	`areasToImprove` text,
	`homework` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_reports_bookingRequestId_unique` UNIQUE(`bookingRequestId`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guardianUserId` int NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`grade` varchar(40) NOT NULL,
	`curriculum` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`nationality` varchar(100) NOT NULL,
	`location` varchar(120) NOT NULL,
	`qualification` varchar(255) NOT NULL,
	`university` varchar(200) NOT NULL,
	`specialization` varchar(160) NOT NULL,
	`experienceYears` int NOT NULL,
	`subjects` text NOT NULL,
	`curricula` text NOT NULL,
	`grades` text NOT NULL,
	`languages` text NOT NULL,
	`hourlyRate` int NOT NULL,
	`bio` text NOT NULL,
	`teachingMethodology` text NOT NULL,
	`introVideoUrl` varchar(1024),
	`weeklyAvailability` text,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`credentialsVerified` boolean NOT NULL DEFAULT false,
	`isElite` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `teacher_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingRequestId` int NOT NULL,
	`teacherProfileId` int NOT NULL,
	`reviewerUserId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teacher_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_reviews_bookingRequestId_unique` UNIQUE(`bookingRequestId`)
);
