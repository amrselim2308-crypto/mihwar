CREATE TABLE `teacher_public_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`email` varchar(320),
	`countryCode` enum('EG','AE','both','other') NOT NULL,
	`city` varchar(120) NOT NULL,
	`subjects` text NOT NULL,
	`curricula` text NOT NULL,
	`grades` varchar(300) NOT NULL,
	`experienceYears` int NOT NULL,
	`languages` varchar(120) NOT NULL,
	`qualificationSummary` varchar(255),
	`professionalSummary` text,
	`contactConsent` boolean NOT NULL,
	`consentedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','contacted','closed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_public_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `teacher_public_app_phone_created_idx` ON `teacher_public_applications` (`phone`,`createdAt`);--> statement-breakpoint
CREATE INDEX `teacher_public_app_status_created_idx` ON `teacher_public_applications` (`status`,`createdAt`);