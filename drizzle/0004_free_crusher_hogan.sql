DROP INDEX `teacher_public_app_phone_created_idx` ON `teacher_public_applications`;--> statement-breakpoint
ALTER TABLE `teacher_public_applications` ADD `phoneNormalized` varchar(15);--> statement-breakpoint
ALTER TABLE `teacher_public_applications` ADD `submissionDate` varchar(10);--> statement-breakpoint
UPDATE `teacher_public_applications`
SET `phoneNormalized` = LEFT(
  CASE
    WHEN LEFT(`phone`, 4) = '0020' THEN SUBSTRING(`phone`, 3)
    WHEN LEFT(`phone`, 5) = '00971' THEN SUBSTRING(`phone`, 3)
    WHEN LEFT(`phone`, 3) = '+20' THEN SUBSTRING(`phone`, 2)
    WHEN LEFT(`phone`, 4) = '+971' THEN SUBSTRING(`phone`, 2)
    WHEN CHAR_LENGTH(`phone`) = 11 AND LEFT(`phone`, 2) = '01' THEN CONCAT('20', SUBSTRING(`phone`, 2))
    WHEN CHAR_LENGTH(`phone`) = 10 AND LEFT(`phone`, 2) = '05' THEN CONCAT('971', SUBSTRING(`phone`, 2))
    ELSE REPLACE(`phone`, '+', '')
  END,
  15
),
`submissionDate` = DATE_FORMAT(`createdAt`, '%Y-%m-%d')
WHERE `phoneNormalized` IS NULL OR `submissionDate` IS NULL;--> statement-breakpoint
UPDATE `teacher_public_applications` AS `later`
JOIN `teacher_public_applications` AS `earlier`
  ON `later`.`phoneNormalized` = `earlier`.`phoneNormalized`
  AND `later`.`submissionDate` = `earlier`.`submissionDate`
  AND `later`.`id` > `earlier`.`id`
SET `later`.`submissionDate` = NULL;--> statement-breakpoint
ALTER TABLE `teacher_public_applications` MODIFY `phoneNormalized` varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE `teacher_public_applications` ADD CONSTRAINT `teacher_public_app_phone_day_uq` UNIQUE(`phoneNormalized`,`submissionDate`);
