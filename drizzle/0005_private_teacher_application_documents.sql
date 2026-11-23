CREATE TABLE `teacher_public_application_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`documentType` enum('qualification','experience','supporting') NOT NULL,
	`originalName` varchar(180) NOT NULL,
	`mimeType` enum('application/pdf','image/jpeg','image/png') NOT NULL,
	`fileSize` int NOT NULL,
	`fileContent` mediumblob NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teacher_public_application_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `teacher_public_application_documents` ADD CONSTRAINT `teacher_public_application_documents_applicationId_teacher_public_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `teacher_public_applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `teacher_public_app_doc_app_idx` ON `teacher_public_application_documents` (`applicationId`,`id`);