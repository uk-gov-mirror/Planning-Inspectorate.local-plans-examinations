import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Response } from 'express';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { buildVirusScanViewData } from '@pins/local-plans-lib/forms/custom-components/file-uploader/question.ts';

/*
sets the flags that cause "scan in progress" banner and any "virus detected" messages at the top of the CYA pages. callers just pass the field names of their file upload questions.
*/
export function setVirusScanViewLocals(res: Response, fieldNames: string[]) {
	const journeyResponse = res.locals.journeyResponse as JourneyResponse | undefined;
	const answers = journeyResponse?.answers ?? {};
	const uploadedFiles = fieldNames.flatMap((fieldName) => {
		const answer = answers[fieldName];
		return Array.isArray(answer) ? (answer as UploadedFile[]) : [];
	});

	const { virusScanInProgress, errorSummary } = buildVirusScanViewData(uploadedFiles);
	res.locals.virusScanInProgress = virusScanInProgress;
	res.locals.virusErrorSummary = errorSummary;
}
