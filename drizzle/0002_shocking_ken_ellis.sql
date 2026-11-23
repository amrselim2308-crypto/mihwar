CREATE TABLE `library_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceId` int NOT NULL,
	`pageNumber` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `library_bookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `library_bookmarks_user_resource_uq` UNIQUE(`userId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `library_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` enum('EG','AE') NOT NULL,
	`curriculumCode` varchar(32) NOT NULL,
	`stageCode` enum('primary','preparatory','secondary','cycle_1','cycle_2','cycle_3') NOT NULL,
	`cycleCode` enum('cycle_1','cycle_2','cycle_3'),
	`gradeCode` varchar(16) NOT NULL,
	`subjectCode` varchar(40) NOT NULL,
	`termCode` enum('term_1','term_2','year') NOT NULL DEFAULT 'year',
	`academicYear` varchar(16),
	`category` enum('official_textbook','authorized_reference','study_notes','past_exams','question_bank') NOT NULL,
	`format` enum('pdf','interactive_quiz','video_summary','external_link') NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`publisherName` varchar(180),
	`sourceUrl` varchar(1024),
	`externalUrl` varchar(1024),
	`storageKey` varchar(512),
	`rightsType` enum('official_portal','teacher_original','licensed_use','external_authorized_link') NOT NULL,
	`rightsNote` text NOT NULL,
	`alignmentAuthority` varchar(40),
	`alignmentReference` varchar(160),
	`status` enum('pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
	`uploaderUserId` int NOT NULL,
	`uploaderTeacherProfileId` int,
	`reviewerUserId` int,
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `library_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `library_bookmarks` ADD CONSTRAINT `library_bookmarks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library_bookmarks` ADD CONSTRAINT `library_bookmarks_resourceId_library_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `library_resources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library_resources` ADD CONSTRAINT `library_resources_uploaderUserId_users_id_fk` FOREIGN KEY (`uploaderUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library_resources` ADD CONSTRAINT `library_resources_teacher_uploader_fk` FOREIGN KEY (`uploaderTeacherProfileId`) REFERENCES `teacher_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library_resources` ADD CONSTRAINT `library_resources_reviewerUserId_users_id_fk` FOREIGN KEY (`reviewerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `library_resources_filter_idx` ON `library_resources` (`countryCode`,`curriculumCode`,`gradeCode`,`subjectCode`,`termCode`,`status`);--> statement-breakpoint
CREATE INDEX `library_resources_category_idx` ON `library_resources` (`category`,`format`,`status`);--> statement-breakpoint
CREATE INDEX `library_resources_stage_idx` ON `library_resources` (`stageCode`,`cycleCode`,`status`);
